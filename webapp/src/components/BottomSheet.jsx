import React, { useEffect, useRef, useState } from "react";
import { X } from "lucide-react"

export default function BottomSheet({
  isOpen,
  onClose,
  height = "auto", // "auto" | number | "50vh"
  children,
  closeOnBackdrop = false,
}) {
  const sheetRef = useRef(null);
  const startY = useRef(0);
  const currentY = useRef(0);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTouchStart = (e) => {
    startY.current = e.touches[0].clientY;
    setDragging(true);
  };

  const handleTouchMove = (e) => {
    if (!dragging) return;

    currentY.current = e.touches[0].clientY;
    const diff = currentY.current - startY.current;

    if (diff > 0) {
      sheetRef.current.style.transform = `translateY(${diff}px)`;
    }
  };

  const handleTouchEnd = () => {
    setDragging(false);
    const diff = currentY.current - startY.current;

    if (diff > 120) {
      onClose?.();
    } else {
      sheetRef.current.style.transform = "";
    }
  };

  const computedHeight =
    height === "auto"
      ? "auto"
      : typeof height === "number"
        ? `${height}px`
        : height;

  return (
    <>
      {/* Backdrop */}
      {closeOnBackdrop && <div
        onClick={() => closeOnBackdrop && onClose?.()}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.4)",
          zIndex: 999,
          backdropFilter: "blur(2px)",
        }}
      />}

      {/* Sheet */}
      <div
        ref={sheetRef}
        // onTouchStart={handleTouchStart}
        // onTouchMove={handleTouchMove}
        // onTouchEnd={handleTouchEnd}
        style={{
          position: "fixed",
          left: 0,
          right: 0,
          bottom: 0,
          height: computedHeight,
          maxHeight: "90vh",
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          zIndex: 99998,
          padding: 4,
          boxShadow: "0 -4px 20px rgba(0,0,0,0.15)",
          animation: "slideUp 0.25s ease",
        }}
        class="bg-surface"
      >
        {/* drag indicator */}
        <div style={{ height: "vh", position: 'absolute', right: 0, left: 0, top: 0 }}>
          {/* <div
            style={{
              marginTop: 7,
              width: 40,
              height: 3,
              background: "#ccc",
              borderRadius: 10,
              margin: "0 auto 12px auto",
            }}
          /> */}
          <button
            onClick={onClose}
            style={{
              position: "absolute",
              right: 0,
              top: 8,
              background: "transparent",
              border: "none",
              cursor: "pointer",
            }}
          >
            <X size={24} color="#888" />
          </button>
        </div>
        <div style={{ overflowY: 'scroll', overflowX:'hidden', marginTop: '7vh', paddingTop: 4, 
          height: 'calc(' + computedHeight + ' - 50px)' }} class="b-top">
          {children}
        </div>
      </div>

      <style>
        {`
          @keyframes slideUp {
            from { transform: translateY(100%); }
            to { transform: translateY(0); }
          }
        `}
      </style>
    </>
  );
}
