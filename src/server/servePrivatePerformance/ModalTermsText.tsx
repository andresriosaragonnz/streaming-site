export interface ModalTermsTextProps {}

export const ModalTermsText = () => (
  <div x-show="expanded" x-collapse class="contract-body">
    <h4>DIRECT SYNCHRONISATION AND ONLINE STREAMING LICENCE AGREEMENT</h4>

    <p>
      <strong>1. PARTIES</strong>
      <br />
      This Agreement is between the Platform and the undersigned
      artist/copyright owner ("Licensor").
    </p>

    <p>
      <strong>2. GRANT OF LICENCE</strong>
      <br />
      The Licensor grants the Platform a worldwide, non-exclusive, royalty-free,
      direct licence to:
      <br />
      a) Synchronize the musical composition and sound recording entitled{" "}
      <strong x-text="active?.title || 'the selected works'"></strong> with
      video footage uploaded by the videographer.
      <br />
      b) Stream, transmit, and display the resulting audiovisual work on the
      Platform's website and related non-commercial channels.
    </p>

    <p>
      <strong>3. DIRECT LICENSING DECLARATION (APRA AMCOS BYPASS)</strong>
      <br />
      The Licensor acknowledges that they retain full ownership of the Work.
      Pursuant to APRA AMCOS direct licensing rules, the Licensor explicitly
      authorizes the Platform to stream and synchronize the Work without
      requiring third-party licensing or fee collection from APRA AMCOS or PPCA.
    </p>

    <p>
      <strong>4. WARRANTIES & INDEMNITY</strong>
      <br />
      The Licensor warrants that:
      <br />
      a) They are the sole creator and copyright owner of the Work, or hold all
      necessary authority to grant this licence.
      <br />
      b) The Work is 100% original and contains no unlicensed third-party
      samples, cover compositions, or unauthorized media.
      <br />
      c) The Licensor agrees to indemnify and hold harmless the Platform against
      any third-party copyright claims or licensing demands arising from the
      streaming of this Work.
    </p>

    <p>
      <strong>5. TERM & TERMINATION</strong>
      <br />
      This licence remains in effect indefinitely until revoked in writing by
      the Licensor. Upon receiving a written revocation, the Platform shall
      remove the media within 5 business days.
    </p>
  </div>
);
