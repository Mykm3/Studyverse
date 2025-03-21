/* @type {import('tailwindcss').Config} 
export default {
    darkMode: ["class"],
    content: ["./index.html", "./src/***.{js,jsx}", "*.{js,ts,jsx,tsx,mdx}"],
    theme: {
      container: {
        center: true,
        padding: "2rem",
        screens: {
          "2xl": "1400px",
        },
      },
      extend: {
        colors: {
          border: "hsl(var(--border))",
          input: "hsl(var(--input))",
          ring: "hsl(var(--ring))",
          background: "hsl(var(--background))",
          foreground: "hsl(var(--foreground))",
          primary: {
            DEFAULT: "hsl(var(--primary))",
            foreground: "hsl(var(--primary-foreground))",
          },
          secondary: {
            DEFAULT: "hsl(var(--secondary))",
            foreground: "hsl(var(--secondary-foreground))",
          },
          destructive: {
            DEFAULT: "hsl(var(--destructive))",
            foreground: "hsl(var(--destructive-foreground))",
          },
          muted: {
            DEFAULT: "hsl(var(--muted))",
            foreground: "hsl(var(--muted-foreground))",
          },
          accent: {
            DEFAULT: "hsl(var(--accent))",
            foreground: "hsl(var(--accent-foreground))",
          },
          popover: {
            DEFAULT: "hsl(var(--popover))",
            foreground: "hsl(var(--popover-foreground))",
          },
          card: {
            DEFAULT: "hsl(var(--card))",
            foreground: "hsl(var(--card-foreground))",
          },
        },
        borderRadius: {
          lg: "var(--radius)",
          md: "calc(var(--radius) - 2px)",
          sm: "calc(var(--radius) - 4px)",
        },
        keyframes: {
          "accordion-down": {
            from: { height: 0 },
            to: { height: "var(--radix-accordion-content-height)" },
          },
          "accordion-up": {
            from: { height: "var(--radix-accordion-content-height)" },
            to: { height: 0 },
          },
        },
        animation: {
          "accordion-down": "accordion-down 0.2s ease-out",
          "accordion-up": "accordion-up 0.2s ease-out",
        },
      },
    },
    plugins: [require("tailwindcss-animate")],
  }
  */

  /** @type {import('tailwindcss').Config} */
export default {
    darkMode: "class",
    content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx,mdx}"],
    theme: {
      container: {
        center: true,
        padding: "2rem",
        screens: {
          "2xl": "1400px",
        },
      },
      extend: {
        colors: {
          border: "hsl(var(--border, 220 13% 91%))", // ✅ Added a default fallback
          input: "hsl(var(--input, 220 13% 91%))",
          ring: "hsl(var(--ring, 220 13% 91%))",
          background: "hsl(var(--background, 0 0% 100%))",
          foreground: "hsl(var(--foreground, 0 0% 0%))",
          primary: {
            DEFAULT: "hsl(var(--primary, 240 100% 50%))",
            foreground: "hsl(var(--primary-foreground, 0 0% 100%))",
          },
          secondary: {
            DEFAULT: "hsl(var(--secondary, 200 100% 50%))",
            foreground: "hsl(var(--secondary-foreground, 0 0% 100%))",
          },
          destructive: {
            DEFAULT: "hsl(var(--destructive, 0 100% 50%))",
            foreground: "hsl(var(--destructive-foreground, 0 0% 100%))",
          },
          muted: {
            DEFAULT: "hsl(var(--muted, 210 10% 50%))",
            foreground: "hsl(var(--muted-foreground, 0 0% 100%))",
          },
          accent: {
            DEFAULT: "hsl(var(--accent, 50 100% 50%))",
            foreground: "hsl(var(--accent-foreground, 0 0% 100%))",
          },
          popover: {
            DEFAULT: "hsl(var(--popover, 0 0% 100%))",
            foreground: "hsl(var(--popover-foreground, 0 0% 0%))",
          },
          card: {
            DEFAULT: "hsl(var(--card, 0 0% 95%))",
            foreground: "hsl(var(--card-foreground, 0 0% 10%))",
          },
        },
        borderRadius: {
          lg: "var(--radius, 12px)", // ✅ Added fallbacks
          md: "calc(var(--radius, 12px) - 2px)",
          sm: "calc(var(--radius, 12px) - 4px)",
        },
        keyframes: {
          "accordion-down": {
            from: { height: 0 },
            to: { height: "var(--radix-accordion-content-height, auto)" },
          },
          "accordion-up": {
            from: { height: "var(--radix-accordion-content-height, auto)" },
            to: { height: 0 },
          },
        },
        animation: {
          "accordion-down": "accordion-down 0.2s ease-out",
          "accordion-up": "accordion-up 0.2s ease-out",
        },
      },
    },
    plugins: [require("tailwindcss-animate")],
  };
  
  