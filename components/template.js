export const windowTemplates = {
    default: {
        headerBg: "bg-gradient-to-r from-cyan-500 to-blue-600",
        contentBg: "bg-white",
        footerBg: "bg-gray-50",
        footerBorder: "border-t border-gray-200",
        rounded: true,
        shadow: "shadow-2xl"
    },

    dark: {
        headerBg: "bg-gray-800",
        contentBg: "bg-gray-900 text-gray-200",
        footerBg: "bg-gray-800",
        footerBorder: "border-t border-gray-700",
        rounded: false,
        shadow: "shadow-lg"
    },

    neon: {
        headerBg: "bg-gradient-to-r from-fuchsia-600 to-purple-600",
        contentBg: "bg-black text-pink-400",
        footerBg: "bg-black",
        footerBorder: "border-t border-fuchsia-600",
        rounded: true,
        shadow: "shadow-[0_0_20px_rgba(255,0,255,0.7)]"
    }
};
