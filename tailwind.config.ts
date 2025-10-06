import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

const config: Config = {
    darkMode: "class",
    content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
  	extend: {
  		colors: {
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'var(--primary)',
  				foreground: 'var(--primary-foreground)',
  				50: 'var(--primary-50)',
  				100: 'var(--primary-100)',
  				200: 'var(--primary-200)',
  				300: 'var(--primary-300)',
  				400: 'var(--primary-400)',
  				500: 'var(--primary-500)',
  				600: 'var(--primary-600)',
  				700: 'var(--primary-700)',
  				800: 'var(--primary-800)',
  				900: 'var(--primary-900)',
  			},
  			secondary: {
  				DEFAULT: 'var(--secondary)',
  				foreground: 'var(--secondary-foreground)',
  				50: 'var(--secondary-50)',
  				100: 'var(--secondary-100)',
  				200: 'var(--secondary-200)',
  				300: 'var(--secondary-300)',
  				400: 'var(--secondary-400)',
  				500: 'var(--secondary-500)',
  				600: 'var(--secondary-600)',
  				700: 'var(--secondary-700)',
  				800: 'var(--secondary-800)',
  				900: 'var(--secondary-900)',
  			},
  			success: {
  				DEFAULT: 'var(--success)',
  				foreground: 'var(--success-foreground)',
  				50: 'var(--success-50)',
  				100: 'var(--success-100)',
  				200: 'var(--success-200)',
  				300: 'var(--success-300)',
  				400: 'var(--success-400)',
  				500: 'var(--success-500)',
  				600: 'var(--success-600)',
  				700: 'var(--success-700)',
  				800: 'var(--success-800)',
  				900: 'var(--success-900)',
  			},
  			warning: {
  				DEFAULT: 'var(--warning)',
  				foreground: 'var(--warning-foreground)',
  				50: 'var(--warning-50)',
  				100: 'var(--warning-100)',
  				200: 'var(--warning-200)',
  				300: 'var(--warning-300)',
  				400: 'var(--warning-400)',
  				500: 'var(--warning-500)',
  				600: 'var(--warning-600)',
  				700: 'var(--warning-700)',
  				800: 'var(--warning-800)',
  				900: 'var(--warning-900)',
  			},
  			destructive: {
  				DEFAULT: 'var(--destructive)',
  				foreground: 'var(--destructive-foreground)',
  				50: 'var(--error-50)',
  				100: 'var(--error-100)',
  				200: 'var(--error-200)',
  				300: 'var(--error-300)',
  				400: 'var(--error-400)',
  				500: 'var(--error-500)',
  				600: 'var(--error-600)',
  				700: 'var(--error-700)',
  				800: 'var(--error-800)',
  				900: 'var(--error-900)',
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			}
  		},
  		fontFamily: {
  			sans: ['var(--font-sans)', 'Inter', 'system-ui', 'sans-serif'],
  			mono: ['var(--font-mono)', 'JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
  		},
  		fontSize: {
  			'xs-fluid': 'clamp(0.75rem, 0.7rem + 0.25vw, 0.875rem)',
  			'sm-fluid': 'clamp(0.875rem, 0.8rem + 0.375vw, 1rem)',
  			'base-fluid': 'clamp(1rem, 0.9rem + 0.5vw, 1.125rem)',
  			'lg-fluid': 'clamp(1.125rem, 1rem + 0.625vw, 1.25rem)',
  			'xl-fluid': 'clamp(1.25rem, 1.1rem + 0.75vw, 1.5rem)',
  			'2xl-fluid': 'clamp(1.5rem, 1.3rem + 1vw, 2rem)',
  			'3xl-fluid': 'clamp(1.875rem, 1.6rem + 1.375vw, 2.5rem)',
  			'4xl-fluid': 'clamp(2.25rem, 1.9rem + 1.75vw, 3rem)',
  			'5xl-fluid': 'clamp(3rem, 2.5rem + 2.5vw, 4rem)',
  		},
  		spacing: {
  			'18': '4.5rem',
  			'88': '22rem',
  			'128': '32rem',
  			'144': '36rem',
  			'responsive-xs': 'clamp(0.5rem, 1vw, 1rem)',
  			'responsive-sm': 'clamp(0.75rem, 1.5vw, 1.5rem)',
  			'responsive-md': 'clamp(1rem, 2vw, 2rem)',
  			'responsive-lg': 'clamp(1.5rem, 3vw, 3rem)',
  			'responsive-xl': 'clamp(2rem, 4vw, 4rem)',
  			'section-sm': 'clamp(2rem, 4vw, 3rem)',
  			'section-md': 'clamp(3rem, 6vw, 5rem)',
  			'section-lg': 'clamp(4rem, 8vw, 7rem)',
  			'section-xl': 'clamp(5rem, 10vw, 10rem)',
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		animation: {
  			'fade-in': 'fadeIn 0.5s ease-in-out',
  			'slide-up': 'slideUp 0.3s ease-out',
  			'slide-down': 'slideDown 0.3s ease-out',
  			'scale-in': 'scaleIn 0.2s ease-out',
  		},
  		keyframes: {
  			fadeIn: {
  				'0%': { opacity: '0' },
  				'100%': { opacity: '1' },
  			},
  			slideUp: {
  				'0%': { transform: 'translateY(10px)', opacity: '0' },
  				'100%': { transform: 'translateY(0)', opacity: '1' },
  			},
  			slideDown: {
  				'0%': { transform: 'translateY(-10px)', opacity: '0' },
  				'100%': { transform: 'translateY(0)', opacity: '1' },
  			},
  			scaleIn: {
  				'0%': { transform: 'scale(0.95)', opacity: '0' },
  				'100%': { transform: 'scale(1)', opacity: '1' },
  			},
  		},
  	}
  },
  plugins: [tailwindcssAnimate],
};
export default config;
