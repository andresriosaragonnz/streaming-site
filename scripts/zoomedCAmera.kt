package com.example.camera_poc_2

import android.Manifest
import android.annotation.SuppressLint
import android.bluetooth.*
import android.bluetooth.le.ScanCallback
import android.bluetooth.le.ScanResult
import android.content.Context
import android.content.pm.ActivityInfo
import android.content.pm.PackageManager
import android.graphics.Color
import android.graphics.Rect
import android.graphics.drawable.GradientDrawable
import android.hardware.camera2.*
import android.hardware.camera2.params.MeteringRectangle
import android.hardware.camera2.params.OutputConfiguration
import android.hardware.camera2.params.SessionConfiguration
import android.media.MediaRecorder
import android.os.Build
import android.os.Bundle
import android.os.Environment
import android.util.Log
import android.util.Range
import android.view.SurfaceHolder
import android.view.View
import android.widget.*
import androidx.activity.enableEdgeToEdge
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import androidx.lifecycle.lifecycleScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import org.json.JSONArray
import org.json.JSONObject
import java.io.File
import java.net.URL
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.UUID

class MainActivity : AppCompatActivity() {

    private val TAG = "CinemaRigBLE"

    // UI Elements: Setup Screen
    private lateinit var setupScreen: LinearLayout
    private lateinit var sceneSpinner: Spinner
    private lateinit var startCameraButton: Button

    // UI Elements: Camera Screen
    private lateinit var cameraScreen: RelativeLayout
    private lateinit var previewSurfaceView: AutoFitSurfaceView
    private lateinit var recordButton: Button
    private lateinit var sceneInfoBox: TextView
    private lateinit var closeAppButton: Button

    // Manual UI Controls
    private lateinit var isoSeekBar: SeekBar
    private lateinit var focusSeekBar: SeekBar
    private lateinit var btnShutter48: Button
    private lateinit var btnShutter100: Button
    private lateinit var btnShutter200: Button
    private lateinit var pinMarkerButton: ImageButton

    // Hardware State
    private var cameraDevice: CameraDevice? = null
    private var captureSession: CameraCaptureSession? = null
    private var mediaRecorder: MediaRecorder? = null
    private var isRecording = false
    private val cameraManager by lazy { getSystemService(Context.CAMERA_SERVICE) as CameraManager }
    private var previewRequestBuilder: CaptureRequest.Builder? = null

    // TARGET PHYSICAL MAIN LENS ID
    private val TARGET_PHYSICAL_CAMERA_ID = "5"

    // Logic State
    private val activeScenes = ArrayList<String>()
    private var currentBaseFilename = ""
    private var currentTake = 1

    // Data Logging State (JSON Edit Markers)
    private var recordingStartTimeMs: Long = 0
    private val currentRecordingMarkers = mutableListOf<JSONObject>()
    private var currentJsonFile: File? = null

    // BLE Configuration
    private val bluetoothAdapter: BluetoothAdapter? by lazy {
        (getSystemService(Context.BLUETOOTH_SERVICE) as BluetoothManager).adapter
    }
    private var bluetoothGatt: BluetoothGatt? = null

    // --- MAIN SENSOR ZOOM BOUNDARIES ---
    private val MIN_ZOOM_LIMIT = 1.0f
    private val MAX_ZOOM_LIMIT = 6.8f
    private var currentZoomFactor = MIN_ZOOM_LIMIT
    private var currentCropRegion: Rect? = null

    // Manual Exposure Controls
    private var isoRange: Range<Int>? = null
    private var currentIso = 100
    private var currentExposureTimeNs: Long = 1_000_000_000L / 48

    // Manual Focus State
    private var minimumFocusDistance: Float = 0.0f
    private var isManualFocusActive = false
    private var currentFocusDistance = 0.0f

    companion object {
        private val RIG_SERVICE_UUID: UUID = UUID.fromString("4f524947-5a4f-4f4d-babe-decafbad0001")
        private val ZOOM_CHAR_UUID: UUID = UUID.fromString("4f524947-5a4f-4f4d-babe-decafbad0002")
        private val CLIENT_CHARACTERISTIC_CONFIG_UUID: UUID = UUID.fromString("00002902-0000-1000-8000-00805f9b34fb")
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        requestedOrientation = ActivityInfo.SCREEN_ORIENTATION_SENSOR_LANDSCAPE
        enableEdgeToEdge()
        setContentView(R.layout.activity_main)

        ViewCompat.setOnApplyWindowInsetsListener(findViewById(R.id.main)) { v, insets ->
            val systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars())
            v.setPadding(systemBars.left, systemBars.top, systemBars.right, systemBars.bottom)
            insets
        }

        setupScreen = findViewById(R.id.setupScreen)
        sceneSpinner = findViewById(R.id.sceneSpinner)
        startCameraButton = findViewById(R.id.startCameraButton)

        cameraScreen = findViewById(R.id.cameraScreen)
        previewSurfaceView = findViewById(R.id.previewSurfaceView)
        previewSurfaceView.setAspectRatio(16, 9)
        recordButton = findViewById(R.id.recordButton)
        sceneInfoBox = findViewById(R.id.sceneInfoBox)
        closeAppButton = findViewById(R.id.closeAppButton)

        isoSeekBar = findViewById(R.id.isoSeekBar)
        focusSeekBar = findViewById(R.id.focusSeekBar)
        btnShutter48 = findViewById(R.id.btnShutter48)
        btnShutter100 = findViewById(R.id.btnShutter100)
        btnShutter200 = findViewById(R.id.btnShutter200)
        pinMarkerButton = findViewById(R.id.pinMarkerButton)

        logAllCameraCapabilities()
        setupManualControls()
        setButtonIdleState()
        loadFilenamesFromWeb()

        if (!checkPermissions()) {
            requestPermissions()
        }

        closeAppButton.setOnClickListener {
            closeCamera()
            disconnectBle()
            finish()
        }

        startCameraButton.setOnClickListener {
            if (activeScenes.isEmpty()) return@setOnClickListener

            currentBaseFilename = activeScenes[sceneSpinner.selectedItemPosition]
            currentTake = 1
            updateSceneInfoBoxUI()

            setupScreen.visibility = View.GONE
            cameraScreen.visibility = View.VISIBLE

            if (checkPermissions()) {
                openCamera()
                startBleDiscoveryStack()
            } else {
                requestPermissions()
            }
        }

        recordButton.setOnClickListener {
            toggleRecordingState()
        }

        sceneInfoBox.setOnClickListener {
            if (isRecording) {
                Toast.makeText(this, "Stop recording before finishing scene", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }
            showFinishSceneDialog()
        }

        previewSurfaceView.holder.addCallback(object : SurfaceHolder.Callback {
            override fun surfaceCreated(holder: SurfaceHolder) {
                if (cameraScreen.visibility == View.VISIBLE && checkPermissions()) {
                    openCamera()
                }
            }
            override fun surfaceChanged(holder: SurfaceHolder, format: Int, width: Int, height: Int) {}
            override fun surfaceDestroyed(holder: SurfaceHolder) {
                closeCamera()
            }
        })
    }

    private fun logAllCameraCapabilities() {
        try {
            for (id in cameraManager.cameraIdList) {
                val characteristics = cameraManager.getCameraCharacteristics(id)
                val facing = characteristics.get(CameraCharacteristics.LENS_FACING)
                val focalLengths = characteristics.get(CameraCharacteristics.LENS_INFO_AVAILABLE_FOCAL_LENGTHS)
                val physicalIds = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                    characteristics.physicalCameraIds
                } else emptySet()

                Log.d("CAMERA_ID_DEBUG", "ID: $id | Facing: $facing | Focals: ${focalLengths?.joinToString()} | Physical IDs: $physicalIds")
            }
        } catch (e: Exception) {
            Log.e("CAMERA_ID_DEBUG", "Failed listing cameras", e)
        }
    }

    private fun setupManualControls() {
        isoSeekBar.setOnSeekBarChangeListener(object : SeekBar.OnSeekBarChangeListener {
            override fun onProgressChanged(seekBar: SeekBar?, progress: Int, fromUser: Boolean) {
                if (!fromUser) return
                isoRange?.let { range ->
                    currentIso = range.lower + ((range.upper - range.lower) * (progress / 100.0f)).toInt()
                    applyManualExposure()
                }
            }
            override fun onStartTrackingTouch(seekBar: SeekBar?) {}
            override fun onStopTrackingTouch(seekBar: SeekBar?) {}
        })

        focusSeekBar.setOnSeekBarChangeListener(object : SeekBar.OnSeekBarChangeListener {
            override fun onProgressChanged(seekBar: SeekBar?, progress: Int, fromUser: Boolean) {
                if (!fromUser) return
                isManualFocusActive = true
                currentFocusDistance = (progress / 100.0f) * minimumFocusDistance
                applyFocusAndCropSettings()
            }
            override fun onStartTrackingTouch(seekBar: SeekBar?) {}
            override fun onStopTrackingTouch(seekBar: SeekBar?) {}
        })

        btnShutter48.setOnClickListener { setShutterWithIsoCompensation(1_000_000_000L / 8) }
        btnShutter100.setOnClickListener { setShutterWithIsoCompensation(1_000_000_000L / 48) }
        btnShutter200.setOnClickListener { setShutterWithIsoCompensation(1_000_000_000L / 200) }

        pinMarkerButton.setOnClickListener {
            if (isRecording) {
                val relativeTimeMs = System.currentTimeMillis() - recordingStartTimeMs
                val relativeTimeSec = relativeTimeMs / 1000f

                val markerObj = JSONObject().apply {
                    put("timestamp_seconds", relativeTimeSec)
                    put("iso", currentIso)
                    put("shutter_speed_ns", currentExposureTimeNs)
                    put("focus_distance", currentFocusDistance)
                }
                currentRecordingMarkers.add(markerObj)
                saveEditMarkersToJson()
                flashMarkerUI("%.2f".format(relativeTimeSec))
            } else {
                Toast.makeText(this, "Start recording to add chapter markers", Toast.LENGTH_SHORT).show()
            }
        }
    }

    private fun setShutterWithIsoCompensation(newExposureTimeNs: Long) {
        if (currentExposureTimeNs == newExposureTimeNs) return

        val oldExposure = currentExposureTimeNs
        currentExposureTimeNs = newExposureTimeNs

        val exposureRatio = oldExposure.toDouble() / newExposureTimeNs.toDouble()
        val targetIso = (currentIso * exposureRatio).toInt()

        isoRange?.let { range ->
            currentIso = targetIso.coerceIn(range.lower, range.upper)
            val progressPercent = ((currentIso - range.lower).toFloat() / (range.upper - range.lower).toFloat() * 100).toInt()
            isoSeekBar.progress = progressPercent
        }

        applyManualExposure()
        Toast.makeText(this, "Auto-Compensated ISO: $currentIso", Toast.LENGTH_SHORT).show()
    }

    private fun applyManualExposure() {
        previewRequestBuilder?.apply {
            set(CaptureRequest.CONTROL_AE_MODE, CaptureRequest.CONTROL_AE_MODE_OFF)
            set(CaptureRequest.SENSOR_SENSITIVITY, currentIso)
            set(CaptureRequest.SENSOR_EXPOSURE_TIME, currentExposureTimeNs)
        }
        applyFocusAndCropSettings()
    }

    private fun applyFocusAndCropSettings() {
        previewRequestBuilder?.apply {
            currentCropRegion?.let { crop ->
                set(CaptureRequest.SCALER_CROP_REGION, crop)

                if (isManualFocusActive) {
                    set(CaptureRequest.CONTROL_AF_MODE, CaptureRequest.CONTROL_AF_MODE_OFF)
                    set(CaptureRequest.LENS_FOCUS_DISTANCE, currentFocusDistance)
                } else {
                    val centerWidth = crop.width() / 5
                    val centerHeight = crop.height() / 5
                    val left = crop.left + (crop.width() - centerWidth) / 2
                    val top = crop.top + (crop.height() - centerHeight) / 2
                    val centerBox = Rect(left, top, left + centerWidth, top + centerHeight)

                    set(CaptureRequest.CONTROL_AF_MODE, CaptureRequest.CONTROL_AF_MODE_CONTINUOUS_VIDEO)
                    set(CaptureRequest.CONTROL_AF_REGIONS, arrayOf(MeteringRectangle(centerBox, MeteringRectangle.METERING_WEIGHT_MAX)))
                }
            }
        }
        try {
            previewRequestBuilder?.build()?.let { request ->
                captureSession?.setRepeatingRequest(request, null, null)
            }
        } catch (e: Exception) {
            Log.e(TAG, "Failed to update focus and crop pipeline", e)
        }
    }

    // --- PERMISSIONS HELPER FUNCTIONS ---

    private fun checkPermissions(): Boolean {
        val cameraGranted = ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED
        val audioGranted = ContextCompat.checkSelfPermission(this, Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED
        val bleScanGranted = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            ContextCompat.checkSelfPermission(this, Manifest.permission.BLUETOOTH_SCAN) == PackageManager.PERMISSION_GRANTED &&
                    ContextCompat.checkSelfPermission(this, Manifest.permission.BLUETOOTH_CONNECT) == PackageManager.PERMISSION_GRANTED
        } else {
            ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED
        }
        return cameraGranted && audioGranted && bleScanGranted
    }

    private fun requestPermissions() {
        val basePermissions = mutableListOf(Manifest.permission.CAMERA, Manifest.permission.RECORD_AUDIO)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            basePermissions.add(Manifest.permission.BLUETOOTH_SCAN)
            basePermissions.add(Manifest.permission.BLUETOOTH_CONNECT)
        } else {
            basePermissions.add(Manifest.permission.ACCESS_FINE_LOCATION)
        }
        ActivityCompat.requestPermissions(this, basePermissions.toTypedArray(), 101)
    }

    private fun hasBleConnectPermission(): Boolean {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            ContextCompat.checkSelfPermission(this, Manifest.permission.BLUETOOTH_CONNECT) == PackageManager.PERMISSION_GRANTED
        } else {
            true
        }
    }

    override fun onRequestPermissionsResult(requestCode: Int, permissions: Array<out String>, grantResults: IntArray) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        if (requestCode == 101 && checkPermissions() && cameraScreen.visibility == View.VISIBLE) {
            openCamera()
            startBleDiscoveryStack()
        }
    }

    // --- BLE TELEMETRY PIPELINE ---

    @SuppressLint("MissingPermission")
    private fun startBleDiscoveryStack() {
        if (!checkPermissions() || bluetoothAdapter == null || !bluetoothAdapter!!.isEnabled) return

        try {
            val scanner = bluetoothAdapter!!.bluetoothLeScanner ?: return

            val bleScanCallback = object : ScanCallback() {
                @SuppressLint("MissingPermission")
                override fun onScanResult(callbackType: Int, result: ScanResult) {
                    try {
                        if (!hasBleConnectPermission()) return
                        if (result.device.name == "LILYGO-CinemaRig") {
                            scanner.stopScan(this)
                            bluetoothGatt = result.device.connectGatt(this@MainActivity, false, gattCallback)
                        }
                    } catch (e: SecurityException) {
                        Log.e(TAG, "SecurityException during BLE scan result connection", e)
                    }
                }
            }
            scanner.startScan(bleScanCallback)
        } catch (e: SecurityException) {
            Log.e(TAG, "SecurityException while starting BLE scan stack", e)
        }
    }

    private val gattCallback = object : BluetoothGattCallback() {
        @SuppressLint("MissingPermission")
        override fun onConnectionStateChange(gatt: BluetoothGatt, status: Int, newState: Int) {
            if (newState == BluetoothProfile.STATE_CONNECTED) {
                try {
                    if (hasBleConnectPermission()) {
                        gatt.discoverServices()
                    }
                } catch (e: SecurityException) {
                    Log.e(TAG, "SecurityException during discoverServices", e)
                }
            }
        }

        @SuppressLint("MissingPermission")
        override fun onServicesDiscovered(gatt: BluetoothGatt, status: Int) {
            if (status == BluetoothGatt.GATT_SUCCESS) {
                try {
                    if (!hasBleConnectPermission()) return
                    val service = gatt.getService(RIG_SERVICE_UUID) ?: return
                    service.getCharacteristic(ZOOM_CHAR_UUID)?.let { char ->
                        gatt.setCharacteristicNotification(char, true)
                        char.getDescriptor(CLIENT_CHARACTERISTIC_CONFIG_UUID)?.let { descriptor ->
                            descriptor.value = BluetoothGattDescriptor.ENABLE_NOTIFICATION_VALUE
                            gatt.writeDescriptor(descriptor)
                        }
                    }
                } catch (e: SecurityException) {
                    Log.e(TAG, "SecurityException while configuring characteristic notifications", e)
                }
            }
        }

        @Deprecated("Deprecated for API 33+")
        override fun onCharacteristicChanged(gatt: BluetoothGatt, characteristic: BluetoothGattCharacteristic) {
            handleCharacteristicChanged(characteristic, characteristic.value)
        }

        override fun onCharacteristicChanged(gatt: BluetoothGatt, characteristic: BluetoothGattCharacteristic, value: ByteArray) {
            handleCharacteristicChanged(characteristic, value)
        }

        private fun handleCharacteristicChanged(characteristic: BluetoothGattCharacteristic, rawBytes: ByteArray) {
            if (characteristic.uuid == ZOOM_CHAR_UUID && rawBytes.size >= 4) {
                val faderStep = (rawBytes[0].toInt() and 0xFF) or
                        ((rawBytes[1].toInt() and 0xFF) shl 8) or
                        ((rawBytes[2].toInt() and 0xFF) shl 16) or
                        ((rawBytes[3].toInt() and 0xFF) shl 24)

                runOnUiThread { processAbsoluteLinearFaderStep(faderStep) }
            }
        }
    }

    private fun processAbsoluteLinearFaderStep(faderStep: Int) {
        val clampedStep = faderStep.coerceIn(0, 200)
        val rawProgress = clampedStep / 200.0f

        currentZoomFactor = MIN_ZOOM_LIMIT + (rawProgress * (MAX_ZOOM_LIMIT - MIN_ZOOM_LIMIT))

        try {
            val targetId = getActiveCameraId()
            val characteristics = cameraManager.getCameraCharacteristics(targetId)
            val activeArray = characteristics.get(CameraCharacteristics.SENSOR_INFO_ACTIVE_ARRAY_SIZE) ?: return

            val newWidth = (activeArray.width() / currentZoomFactor).toInt()
            val newHeight = (activeArray.height() / currentZoomFactor).toInt()
            val left = (activeArray.width() - newWidth) / 2
            val top = (activeArray.height() - newHeight) / 2

            currentCropRegion = Rect(left, top, left + newWidth, top + newHeight)
            applyFocusAndCropSettings()
        } catch (e: Exception) {
            Log.e(TAG, "Failed to apply sensor crop zoom", e)
        }
    }

    private fun getActiveCameraId(): String {
        return try {
            if (cameraManager.cameraIdList.contains(TARGET_PHYSICAL_CAMERA_ID)) {
                TARGET_PHYSICAL_CAMERA_ID
            } else {
                "0"
            }
        } catch (e: Exception) {
            "0"
        }
    }

    @SuppressLint("MissingPermission")
    private fun openCamera() {
        if (cameraDevice != null) return
        try {
            val cameraId = getActiveCameraId()
            Log.d(TAG, "Opening Physical Camera ID: $cameraId")

            val characteristics = cameraManager.getCameraCharacteristics(cameraId)
            isoRange = characteristics.get(CameraCharacteristics.SENSOR_INFO_SENSITIVITY_RANGE)
            minimumFocusDistance = characteristics.get(CameraCharacteristics.LENS_INFO_MINIMUM_FOCUS_DISTANCE) ?: 0.0f

            if (!checkPermissions()) return
            cameraManager.openCamera(cameraId, object : CameraDevice.StateCallback() {
                override fun onOpened(camera: CameraDevice) {
                    cameraDevice = camera
                    startPreviewSession()
                }
                override fun onDisconnected(camera: CameraDevice) { closeCamera() }
                override fun onError(camera: CameraDevice, error: Int) { closeCamera() }
            }, null)
        } catch (e: SecurityException) {
            Log.e(TAG, "SecurityException opening camera", e)
        } catch (e: Exception) {
            Log.e(TAG, "Failed to open camera", e)
        }
    }

    private fun startPreviewSession() {
        val camera = cameraDevice ?: return
        try {
            val previewSurface = previewSurfaceView.holder.surface
            currentZoomFactor = MIN_ZOOM_LIMIT
            currentCropRegion = null

            previewRequestBuilder = camera.createCaptureRequest(CameraDevice.TEMPLATE_PREVIEW).apply {
                addTarget(previewSurface)
                set(CaptureRequest.CONTROL_MODE, CameraMetadata.CONTROL_MODE_AUTO)
            }

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                val outputConfig = OutputConfiguration(previewSurface).apply {
                    setPhysicalCameraId(TARGET_PHYSICAL_CAMERA_ID)
                }
                val sessionConfig = SessionConfiguration(
                    SessionConfiguration.SESSION_REGULAR,
                    listOf(outputConfig),
                    mainExecutor,
                    object : CameraCaptureSession.StateCallback() {
                        override fun onConfigured(session: CameraCaptureSession) {
                            captureSession = session
                            applyManualExposure()
                        }
                        override fun onConfigureFailed(session: CameraCaptureSession) {}
                    }
                )
                camera.createCaptureSession(sessionConfig)
            } else {
                @Suppress("DEPRECATION")
                camera.createCaptureSession(listOf(previewSurface), object : CameraCaptureSession.StateCallback() {
                    override fun onConfigured(session: CameraCaptureSession) {
                        captureSession = session
                        applyManualExposure()
                    }
                    override fun onConfigureFailed(session: CameraCaptureSession) {}
                }, null)
            }
        } catch (e: Exception) {
            Log.e(TAG, "Failed to start preview session", e)
        }
    }

    private fun setUpMediaRecorder() {
        val finalTargetName = "$currentBaseFilename-$currentTake.mp4"
        val appFilesDir = getExternalFilesDir(Environment.DIRECTORY_MOVIES)
        if (appFilesDir != null && !appFilesDir.exists()) appFilesDir.mkdirs()
        val videoFile = File(appFilesDir, finalTargetName)

        @Suppress("DEPRECATION")
        mediaRecorder = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) MediaRecorder(this) else MediaRecorder()
        mediaRecorder?.apply {
            setAudioSource(MediaRecorder.AudioSource.MIC)
            setVideoSource(MediaRecorder.VideoSource.SURFACE)
            setOutputFormat(MediaRecorder.OutputFormat.MPEG_4)
            setOutputFile(videoFile.absolutePath)
            setVideoEncoder(MediaRecorder.VideoEncoder.H264)
            setAudioEncoder(MediaRecorder.AudioEncoder.AAC)
            setVideoSize(1920, 1080)
            setVideoFrameRate(24)
            setVideoEncodingBitRate(20000000)
            prepare()
        }
    }

    private fun startRecording() {
        val camera = cameraDevice ?: return
        try {
            captureSession?.stopRepeating()
            captureSession?.close()
            captureSession = null
            setUpMediaRecorder()

            val previewSurface = previewSurfaceView.holder.surface
            val recorderSurface = mediaRecorder?.surface ?: return

            previewRequestBuilder = camera.createCaptureRequest(CameraDevice.TEMPLATE_RECORD).apply {
                addTarget(previewSurface)
                addTarget(recorderSurface)
                set(CaptureRequest.CONTROL_MODE, CameraMetadata.CONTROL_MODE_AUTO)
            }

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                val previewConfig = OutputConfiguration(previewSurface).apply {
                    setPhysicalCameraId(TARGET_PHYSICAL_CAMERA_ID)
                }
                val recorderConfig = OutputConfiguration(recorderSurface).apply {
                    setPhysicalCameraId(TARGET_PHYSICAL_CAMERA_ID)
                }
                val sessionConfig = SessionConfiguration(
                    SessionConfiguration.SESSION_REGULAR,
                    listOf(previewConfig, recorderConfig),
                    mainExecutor,
                    object : CameraCaptureSession.StateCallback() {
                        override fun onConfigured(session: CameraCaptureSession) {
                            captureSession = session
                            try {
                                applyManualExposure()
                                mediaRecorder?.start()

                                isRecording = true
                                recordingStartTimeMs = System.currentTimeMillis()
                                currentRecordingMarkers.clear()

                                val appFilesDir = getExternalFilesDir(Environment.DIRECTORY_MOVIES)
                                if (appFilesDir != null && !appFilesDir.exists()) appFilesDir.mkdirs()
                                currentJsonFile = File(appFilesDir, "$currentBaseFilename-$currentTake.json")
                                saveEditMarkersToJson()

                                runOnUiThread {
                                    setButtonRecordingState()
                                    sceneInfoBox.setBackgroundColor(Color.parseColor("#80000000"))
                                    sceneInfoBox.setTextColor(Color.WHITE)
                                    updateSceneInfoBoxUI()
                                }
                            } catch (e: Exception) {}
                        }
                        override fun onConfigureFailed(session: CameraCaptureSession) {}
                    }
                )
                camera.createCaptureSession(sessionConfig)
            } else {
                @Suppress("DEPRECATION")
                camera.createCaptureSession(listOf(previewSurface, recorderSurface), object : CameraCaptureSession.StateCallback() {
                    override fun onConfigured(session: CameraCaptureSession) {
                        captureSession = session
                        try {
                            applyManualExposure()
                            mediaRecorder?.start()

                            isRecording = true
                            recordingStartTimeMs = System.currentTimeMillis()
                            currentRecordingMarkers.clear()

                            val appFilesDir = getExternalFilesDir(Environment.DIRECTORY_MOVIES)
                            if (appFilesDir != null && !appFilesDir.exists()) appFilesDir.mkdirs()
                            currentJsonFile = File(appFilesDir, "$currentBaseFilename-$currentTake.json")
                            saveEditMarkersToJson()

                            runOnUiThread {
                                setButtonRecordingState()
                                sceneInfoBox.setBackgroundColor(Color.parseColor("#80000000"))
                                sceneInfoBox.setTextColor(Color.WHITE)
                                updateSceneInfoBoxUI()
                            }
                        } catch (e: Exception) {}
                    }
                    override fun onConfigureFailed(session: CameraCaptureSession) {}
                }, null)
            }
        } catch (e: Exception) {}
    }

    private fun stopRecording() {
        try { mediaRecorder?.stop() } catch (e: Exception) {}
        mediaRecorder?.reset()
        mediaRecorder?.release()
        mediaRecorder = null

        saveEditMarkersToJson()
        currentJsonFile = null

        isRecording = false
        currentTake++

        runOnUiThread {
            setButtonIdleState()
            sceneInfoBox.setBackgroundColor(Color.parseColor("#80000000"))
            sceneInfoBox.setTextColor(Color.WHITE)
            updateSceneInfoBoxUI()
        }

        startPreviewSession()
    }

    private fun closeCamera() {
        captureSession?.close()
        captureSession = null
        cameraDevice?.close()
        cameraDevice = null
        previewRequestBuilder = null
    }

    private fun saveEditMarkersToJson() {
        try {
            val root = JSONObject()
            root.put("video_file", "$currentBaseFilename-$currentTake.mp4")

            val markersArray = JSONArray()
            currentRecordingMarkers.forEach { markersArray.put(it) }
            root.put("chapters_and_markers", markersArray)

            currentJsonFile?.writeText(root.toString(4))
        } catch (e: Exception) {
            Log.e(TAG, "Failed to write JSON marker data", e)
        }
    }

    private fun toggleRecordingState() {
        if (isRecording) stopRecording() else startRecording()
    }

    @SuppressLint("MissingPermission")
    private fun disconnectBle() {
        try {
            if (hasBleConnectPermission()) {
                bluetoothGatt?.disconnect()
                bluetoothGatt?.close()
                bluetoothGatt = null
            }
        } catch (e: SecurityException) {
            Log.e(TAG, "SecurityException while disconnecting BLE", e)
        }
    }

    private fun flashMarkerUI(timeFormatted: String) {
        sceneInfoBox.setBackgroundColor(Color.GREEN)
        sceneInfoBox.setTextColor(Color.BLACK)
        sceneInfoBox.text = "PIN MARKER: ${timeFormatted}s"
        sceneInfoBox.postDelayed({
            if (isRecording) {
                sceneInfoBox.setBackgroundColor(Color.parseColor("#80000000"))
                sceneInfoBox.setTextColor(Color.WHITE)
                updateSceneInfoBoxUI()
            }
        }, 1500)
    }

    private fun updateSceneInfoBoxUI() {
        val displayBase = if (currentBaseFilename.length > 10) currentBaseFilename.take(10) + "..." else currentBaseFilename
        sceneInfoBox.text = "$displayBase-$currentTake"
    }

    private fun showFinishSceneDialog() {
        AlertDialog.Builder(this)
            .setTitle("Finish Recording?")
            .setMessage("Are you done with scene:\n$currentBaseFilename")
            .setPositiveButton("YES, FINISH") { _, _ ->
                activeScenes.remove(currentBaseFilename)
                updateSpinnerAdapter()
                closeCamera()
                disconnectBle()
                cameraScreen.visibility = View.GONE
                setupScreen.visibility = View.VISIBLE
            }
            .setNegativeButton("CANCEL", null)
            .show()
    }

    private fun updateSpinnerAdapter() {
        if (activeScenes.isEmpty()) {
            activeScenes.add("NO SCENES LEFT")
            startCameraButton.isEnabled = false
        }
        val adapter = ArrayAdapter(this, R.layout.spinner_item, activeScenes)
        adapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item)
        sceneSpinner.adapter = adapter
    }

    private fun loadFilenamesFromWeb() {
        lifecycleScope.launch(Dispatchers.IO) {
            try {
                val url = URL("https://auckland-oner-poc.netlify.app/filenames.json")
                val connection = url.openConnection() as java.net.HttpURLConnection
                connection.requestMethod = "GET"
                connection.connectTimeout = 5000

                if (connection.responseCode == java.net.HttpURLConnection.HTTP_OK) {
                    val jsonString = connection.inputStream.bufferedReader().use { it.readText() }
                    val rootObject = JSONObject(jsonString)

                    if (rootObject.getString("status") == "success") {
                        val scenesArray = rootObject.getJSONObject("data").getJSONArray("scenes")
                        activeScenes.clear()
                        for (i in 0 until scenesArray.length()) {
                            activeScenes.add(scenesArray.getString(i))
                        }
                        withContext(Dispatchers.Main) { updateSpinnerAdapter() }
                    }
                }
            } catch (e: Exception) {
                e.printStackTrace()
                withContext(Dispatchers.Main) {
                    val fallbackName = SimpleDateFormat("yyyyMMdd-HHmmss", Locale.getDefault()).format(Date())
                    activeScenes.clear()
                    activeScenes.add(fallbackName)
                    updateSpinnerAdapter()
                }
            }
        }
    }

    private fun setButtonIdleState() {
        val idleDrawable = GradientDrawable().apply {
            shape = GradientDrawable.OVAL
            setColor(Color.RED)
        }
        recordButton.background = idleDrawable
        val params = recordButton.layoutParams
        params.width = android.view.ViewGroup.LayoutParams.MATCH_PARENT
        params.height = android.view.ViewGroup.LayoutParams.MATCH_PARENT
        recordButton.layoutParams = params
    }

    private fun setButtonRecordingState() {
        val activeDrawable = GradientDrawable().apply {
            shape = GradientDrawable.RECTANGLE
            cornerRadius = 8f
            setColor(Color.GRAY)
        }
        recordButton.background = activeDrawable
        val density = resources.displayMetrics.density
        val pixelDimension = (32 * density).toInt()
        val params = recordButton.layoutParams
        params.width = pixelDimension
        params.height = pixelDimension
        recordButton.layoutParams = params
    }
}