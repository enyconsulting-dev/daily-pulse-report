/**
 * Windows 2000 / XP Luna-style UI primitives
 * All styling via inline styles for maximum isolation.
 */

import React from "react";

const BASE_FONT: React.CSSProperties = {
  fontFamily: "Tahoma, 'MS Sans Serif', 'Microsoft Sans Serif', Arial, sans-serif",
  fontSize: "11px",
};

/* ─────────────────────────────────────────────
   Raised Button
───────────────────────────────────────────── */
interface BtnProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "primary";
  fullWidth?: boolean;
}
export function WinButton({ variant = "default", fullWidth, style, children, ...rest }: BtnProps) {
  const isPrimary = variant === "primary";
  return (
    <button
      style={{
        ...BASE_FONT,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "4px",
        padding: "4px 14px",
        minWidth: fullWidth ? "100%" : "75px",
        width: fullWidth ? "100%" : undefined,
        background: isPrimary ? "#D4D0C8" : "#D4D0C8",
        color: "#000",
        cursor: rest.disabled ? "default" : "pointer",
        opacity: rest.disabled ? 0.5 : 1,
        borderTop: "2px solid #ffffff",
        borderLeft: "2px solid #ffffff",
        borderRight: "2px solid #404040",
        borderBottom: "2px solid #404040",
        boxShadow: "inset 1px 1px 0 #E8E4DC, inset -1px -1px 0 #808080",
        userSelect: "none",
        ...style,
      }}
      {...rest}
    >
      {children}
    </button>
  );
}

/* ─────────────────────────────────────────────
   Text Input
───────────────────────────────────────────── */
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}
export function WinInput({ style, ...rest }: InputProps) {
  return (
    <input
      style={{
        ...BASE_FONT,
        display: "block",
        width: "100%",
        padding: "2px 4px",
        background: rest.disabled ? "#D4D0C8" : "#ffffff",
        color: "#000",
        borderTop: "2px solid #808080",
        borderLeft: "2px solid #808080",
        borderRight: "2px solid #D4D0C8",
        borderBottom: "2px solid #D4D0C8",
        boxShadow: "inset 1px 1px 0 #404040",
        outline: "none",
        ...style,
      }}
      {...rest}
    />
  );
}

/* ─────────────────────────────────────────────
   Textarea
───────────────────────────────────────────── */
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}
export function WinTextarea({ style, ...rest }: TextareaProps) {
  return (
    <textarea
      style={{
        ...BASE_FONT,
        display: "block",
        width: "100%",
        padding: "2px 4px",
        background: "#ffffff",
        color: "#000",
        borderTop: "2px solid #808080",
        borderLeft: "2px solid #808080",
        borderRight: "2px solid #D4D0C8",
        borderBottom: "2px solid #D4D0C8",
        boxShadow: "inset 1px 1px 0 #404040",
        outline: "none",
        resize: "vertical",
        minHeight: "72px",
        ...style,
      }}
      {...rest}
    />
  );
}

/* ─────────────────────────────────────────────
   Select / Dropdown
───────────────────────────────────────────── */
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {}
export function WinSelect({ style, children, ...rest }: SelectProps) {
  return (
    <div style={{ position: "relative", width: "100%" }}>
      <select
        style={{
          ...BASE_FONT,
          display: "block",
          width: "100%",
          padding: "2px 20px 2px 4px",
          background: rest.disabled ? "#D4D0C8" : "#ffffff",
          color: "#000",
          borderTop: "2px solid #808080",
          borderLeft: "2px solid #808080",
          borderRight: "2px solid #D4D0C8",
          borderBottom: "2px solid #D4D0C8",
          boxShadow: "inset 1px 1px 0 #404040",
          appearance: "none",
          WebkitAppearance: "none",
          outline: "none",
          cursor: "pointer",
          ...style,
        }}
        {...rest}
      >
        {children}
      </select>
      {/* Classic dropdown arrow button */}
      <div
        style={{
          position: "absolute",
          right: 0, top: 0, bottom: 0,
          width: "18px",
          background: "#D4D0C8",
          borderTop: "2px solid #ffffff",
          borderLeft: "1px solid #808080",
          borderRight: "2px solid #404040",
          borderBottom: "2px solid #404040",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          pointerEvents: "none",
        }}
      >
        <svg width="7" height="4" viewBox="0 0 7 4" fill="none">
          <path d="M0 0l3.5 4L7 0z" fill="#000"/>
        </svg>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Window / Card panel
───────────────────────────────────────────── */
interface PanelProps {
  title?: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
  titleBarColor?: "blue" | "grey";
  icon?: React.ReactNode;
}
export function WinPanel({ title, children, style, titleBarColor = "grey", icon }: PanelProps) {
  return (
    <div
      style={{
        background: "#D4D0C8",
        borderTop: "2px solid #ffffff",
        borderLeft: "2px solid #ffffff",
        borderRight: "2px solid #404040",
        borderBottom: "2px solid #404040",
        boxShadow: "1px 1px 0 #808080",
        marginBottom: "8px",
        ...style,
      }}
    >
      {title && (
        <div
          style={{
            background: titleBarColor === "blue"
              ? "linear-gradient(to right, #0A246A 0%, #A6CAF0 100%)"
              : "#D4D0C8",
            color: titleBarColor === "blue" ? "#fff" : "#000",
            fontWeight: "bold",
            fontSize: "11px",
            padding: "3px 6px",
            display: "flex",
            alignItems: "center",
            gap: "5px",
            userSelect: "none",
            borderBottom: titleBarColor === "grey" ? "1px solid #808080" : undefined,
          }}
        >
          {icon}
          {title}
        </div>
      )}
      <div style={{ padding: "8px" }}>{children}</div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Fieldset / Group Box
───────────────────────────────────────────── */
interface GroupBoxProps {
  legend: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
}
export function WinGroupBox({ legend, children, style }: GroupBoxProps) {
  return (
    <fieldset
      style={{
        ...BASE_FONT,
        border: "1px solid #808080",
        borderTop: "1px solid #808080",
        boxShadow: "1px 1px 0 #fff",
        padding: "8px",
        margin: 0,
        ...style,
      }}
    >
      <legend style={{ ...BASE_FONT, fontWeight: "bold", padding: "0 4px" }}>{legend}</legend>
      {children}
    </fieldset>
  );
}

/* ─────────────────────────────────────────────
   Label
───────────────────────────────────────────── */
interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {}
export function WinLabel({ style, children, ...rest }: LabelProps) {
  return (
    <label style={{ ...BASE_FONT, display: "block", marginBottom: "2px", ...style }} {...rest}>
      {children}
    </label>
  );
}

/* ─────────────────────────────────────────────
   Horizontal separator
───────────────────────────────────────────── */
export function WinSeparator() {
  return (
    <div style={{
      borderTop: "1px solid #808080",
      borderBottom: "1px solid #fff",
      margin: "6px 0",
    }} />
  );
}

/* ─────────────────────────────────────────────
   Tabs
───────────────────────────────────────────── */
interface TabsProps {
  tabs: string[];
  active: string;
  onChange: (tab: string) => void;
}
export function WinTabs({ tabs, active, onChange }: TabsProps) {
  return (
    <div style={{ display: "flex", gap: "2px", position: "relative" }}>
      {tabs.map((tab) => {
        const isActive = tab === active;
        return (
          <button
            key={tab}
            onClick={() => onChange(tab)}
            style={{
              ...BASE_FONT,
              padding: "4px 14px 6px",
              background: "#D4D0C8",
              cursor: "pointer",
              color: "#000",
              fontWeight: isActive ? "bold" : "normal",
              borderTop: "2px solid #ffffff",
              borderLeft: "2px solid #ffffff",
              borderRight: "2px solid #808080",
              borderBottom: isActive ? "2px solid #D4D0C8" : "2px solid #808080",
              marginBottom: isActive ? "-2px" : "0",
              zIndex: isActive ? 2 : 1,
              position: "relative",
            }}
          >
            {tab}
          </button>
        );
      })}
    </div>
  );
}

/* ─────────────────────────────────────────────
   Info / status box
───────────────────────────────────────────── */
interface InfoBoxProps {
  variant?: "info" | "warning" | "success" | "error";
  children: React.ReactNode;
}
export function WinInfoBox({ variant = "info", children }: InfoBoxProps) {
  const colors: Record<string, { bg: string; border: string; icon: string }> = {
    info:    { bg: "#ECF3FB", border: "#0A246A", icon: "ℹ" },
    warning: { bg: "#FFFBE6", border: "#A07000", icon: "⚠" },
    success: { bg: "#E6F4EA", border: "#006400", icon: "✓" },
    error:   { bg: "#FBE6E6", border: "#8B0000", icon: "✕" },
  };
  const c = colors[variant];
  return (
    <div style={{
      ...BASE_FONT,
      background: c.bg,
      border: `1px solid ${c.border}`,
      padding: "6px 8px",
      display: "flex",
      gap: "8px",
      alignItems: "flex-start",
    }}>
      <span style={{ fontWeight: "bold", flexShrink: 0 }}>{c.icon}</span>
      <div>{children}</div>
    </div>
  );
}
