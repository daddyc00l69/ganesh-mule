import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        panel: 'var(--panel)',
        card: {
          DEFAULT: 'var(--card)',
          foreground: 'var(--card-foreground)',
        },
        popover: {
          DEFAULT: 'var(--popover)',
          foreground: 'var(--popover-foreground)',
        },
        primary: {
          DEFAULT: 'var(--primary)',
          foreground: 'var(--primary-foreground)',
        },
        secondary: {
          DEFAULT: 'var(--secondary)',
          foreground: 'var(--secondary-foreground)',
        },
        muted: {
          DEFAULT: 'var(--muted)',
          foreground: 'var(--muted-foreground)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          foreground: 'var(--accent-foreground)',
        },
        destructive: {
          DEFAULT: 'var(--destructive)',
          foreground: 'var(--destructive-foreground)',
        },
        border: 'var(--border)',
        input: 'var(--input)',
        ring: 'var(--ring)',
        brand: {
          DEFAULT: 'var(--brand)',
          foreground: 'var(--brand-foreground)',
          muted: 'var(--brand-muted)',
        },
        status: {
          running: 'var(--status-running)',
          done: 'var(--status-done)',
          interrupted: 'var(--status-interrupted)',
          success: 'var(--success)',
        },
        sidebar: {
          DEFAULT: 'var(--sidebar)',
          foreground: 'var(--sidebar-foreground)',
          primary: 'var(--sidebar-primary)',
          'primary-foreground': 'var(--sidebar-primary-foreground)',
          accent: 'var(--sidebar-accent)',
          'accent-foreground': 'var(--sidebar-accent-foreground)',
          border: 'var(--sidebar-border)',
          ring: 'var(--sidebar-ring)',
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        serif: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
        control: 'var(--radius-control)',
      },
      boxShadow: {
        glass: 'inset 0 1px 0 var(--glass-rim), inset 0 0 0 1px var(--glass-inner), 0 0 0 1px var(--glass-edge), 0 1px 2px var(--glass-contact), 0 12px 32px -14px var(--glass-shade)',
        'glass-popover': 'inset 0 1px 0 var(--glass-rim), inset 0 -1px 0 var(--popover-under), 0 0 0 1px var(--popover-edge), 0 24px 60px -18px var(--glass-shade), 0 6px 16px -6px var(--glass-lift)',
        'glass-primary': 'inset 0 1px 0 var(--primary-rim), inset 0 -1px 0 var(--primary-under), inset 0 0 0 1px var(--primary-inner), 0 1px 2px var(--glass-contact), 0 8px 18px -9px var(--glass-shade)',
        'glass-control': 'inset 0 1px 0 var(--glass-rim), 0 0 0 1px var(--glass-edge), 0 1px 2px var(--glass-contact)',
      },
      backdropBlur: {
        glass: '26px',
        control: '14px',
      },
    },
  },
  plugins: [],
};

export default config;
