export function clerkConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim() && process.env.CLERK_SECRET_KEY?.trim());
}

export const clerkAppearance = {
  variables: {
    colorPrimary: "#00274C",
    colorText: "#1E1E1E",
    colorBackground: "#FFFFFF",
    fontFamily: "Poppins, Helvetica Neue, Arial, sans-serif",
    borderRadius: "0px",
  },
  elements: {
    card: { borderTop: "3px solid #FFCB05", boxShadow: "none" },
    socialButtonsBlockButton: { border: "3px solid #FFCB05" },
    formButtonPrimary: { backgroundColor: "#00274C" },
  },
};
