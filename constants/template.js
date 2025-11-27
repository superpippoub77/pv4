// ======================================================
// 1. Templates e funzioni di base (già convertite)
// ======================================================

const windowTemplates = {
    default: {
        headerBg: "linear-gradient(to right, #06b6d4, #2c3e50)",
        contentBg: "#ffffff",
        contentColor: "#000000",
        footerBg: "#f9fafb",
        footerBorder: "1px solid #e5e7eb",
        rounded: true,
        shadow: "0 25px 50px rgba(0,0,0,0.25)"
    },
    dark: {
        headerBg: "#1f2937",
        contentBg: "#111827",
        contentColor: "#e5e7eb",
        footerBg: "#1f2937",
        footerBorder: "1px solid #374151",
        rounded: false,
        shadow: "0 15px 30px rgba(0,0,0,0.25)"
    },
    neon: {
        headerBg: "linear-gradient(to right, #a21caf, #7e22ce)",
        contentBg: "#000000",
        contentColor: "#f472b6",
        footerBg: "#000000",
        footerBorder: "1px solid #a21caf",
        rounded: true,
        shadow: "0 0 20px rgba(255,0,255,0.7)"
    }
};