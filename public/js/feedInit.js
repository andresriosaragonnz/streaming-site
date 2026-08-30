var V = "user_subscriptions";
var X = () => {
  let q = localStorage.getItem(V);
  return q ? JSON.parse(q) : { favorites: [] };
};
function Z(q, z) {
  if (!z || z.length === 0) return "";
  let B = btoa(z.join(","))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  return `${q}/feed?art=${B}`;
}
function Q() {
  if (typeof window > "u") return !1;
  if ((console.log("dsadsa"), !window.location.pathname.includes("feed")))
    return !1;
  if (
    document.getElementById("performance-grid")?.getElementsByClassName("card")
      .length > 0
  )
    return !1;
  if (new URLSearchParams(window.location.search).has("art")) return !1;
  let H = X();
  if (H.length === 0) return !1;
  let J = Z(window.location.origin, H);
  if (J) return (window.location.replace(J), !0);
  return !1;
}
document.addEventListener("DOMContentLoaded", () => {
  Q();
});
