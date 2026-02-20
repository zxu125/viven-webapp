export function uiLog(...args) {
    return
    const elId = "__ui_log__";
    let el = document.getElementById(elId);
    if (!el) {
      el = document.createElement("pre");
      el.id = elId;
      el.style.position = "fixed";
      el.style.left = "8px";
      el.style.right = "8px";
      el.style.bottom = "8px";
      el.style.maxHeight = "40vh";
      el.style.overflow = "auto";
      el.style.zIndex = "999999";
      el.style.fontSize = "11px";
      el.style.padding = "8px";
      el.style.borderRadius = "12px";
      el.style.background = "rgba(0,0,0,0.8)";
      el.style.color = "white";
      document.body.appendChild(el);
    }
  
    const line = args
      .map((a) => {
        try { return typeof a === "string" ? a : JSON.stringify(a, null, 2); }
        catch { return String(a); }
      })
      .join(" ");
  
    el.textContent += line + "\n";
  }
  