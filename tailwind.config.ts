
import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				},
				stakerpol: {
					navy: 'hsl(212 84% 16%)',
					gray: 'hsl(215 16% 47%)',
					orange: 'hsl(25 100% 50%)',
					lightgray: 'hsl(210 40% 96%)'
				},
				'surface-soft': 'hsl(var(--color-surface-soft))',
				'border-line': 'hsl(var(--color-border-line))',
				'red-accent': 'hsl(var(--color-red-accent))',
				'navy-brand': 'hsl(var(--color-navy-brand))',
				'orange-cta': 'hsl(var(--color-orange-cta))',
				ink: {
					DEFAULT: 'hsl(var(--color-ink))',
					soft: 'hsl(var(--color-ink-soft))',
				},
				'green-available': 'hsl(var(--color-green-available))',
				whatsapp: 'hsl(var(--color-whatsapp))',
				'amber-soft': {
					DEFAULT: 'hsl(var(--color-amber-soft-bg))',
					foreground: 'hsl(var(--color-amber-soft-fg))',
				},
				'green-soft': {
					DEFAULT: 'hsl(var(--color-green-soft-bg))',
					foreground: 'hsl(var(--color-green-soft-fg))',
				},
				admin: {
					orange: 'hsl(var(--admin-orange))',
					dark: 'hsl(var(--admin-dark))',
					bg: 'hsl(var(--admin-bg))',
					border: 'hsl(var(--admin-border))',
					text: 'hsl(var(--admin-text))',
					muted: 'hsl(var(--admin-muted))',
					green: 'hsl(var(--admin-green))',
					red: 'hsl(var(--admin-red))',
				},
				editorial: {
					ink: 'hsl(var(--editorial-ink))',
					muted: 'hsl(var(--editorial-muted))',
					line: 'hsl(var(--editorial-line))',
					accent: 'hsl(var(--editorial-accent))',
					ok: 'hsl(var(--editorial-ok))',
					bad: 'hsl(var(--editorial-bad))',
					bg: 'hsl(var(--editorial-bg))',
				}
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				'accordion-down': {
					from: { gridTemplateRows: '0fr', opacity: '0' },
					to: { gridTemplateRows: '1fr', opacity: '1' },
				},
				'accordion-up': {
					from: { gridTemplateRows: '1fr', opacity: '1' },
					to: { gridTemplateRows: '0fr', opacity: '0' },
				},
				'fade-in': {
					'0%': {
						opacity: '0',
						transform: 'translateY(10px)'
					},
					'100%': {
						opacity: '1',
						transform: 'translateY(0)'
					}
				},
				'slide-in': {
					'0%': {
						transform: 'translateX(-10px)',
						opacity: '0'
					},
					'100%': {
						transform: 'translateX(0)',
						opacity: '1'
					}
				},
				'zoom-in': {
					'0%': {
						transform: 'scale(0.95)',
						opacity: '0'
					},
					'100%': {
						transform: 'scale(1)',
						opacity: '1'
					}
				},
			'pulse-light': {
				'0%, 100%': {
					opacity: '1'
				},
				'50%': {
					opacity: '0.8'
				}
			},
			'pulse-glow': {
				'0%, 100%': {
					boxShadow: '0 0 0 0 hsla(25, 100%, 50%, 0.5)'
				},
				'50%': {
					boxShadow: '0 0 0 10px hsla(25, 100%, 50%, 0)'
				}
			},
			'slide-up': {
				'0%': {
					transform: 'translateY(100%)',
					opacity: '0'
				},
				'100%': {
					transform: 'translateY(0)',
					opacity: '1'
				}
			}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'fade-in': 'fade-in 0.5s ease-out',
				'slide-in': 'slide-in 0.4s ease-out',
				'zoom-in': 'zoom-in 0.3s ease-out',
			'pulse-light': 'pulse-light 2s infinite ease-in-out',
			'slide-up': 'slide-up 0.3s ease-out'
			},
			fontFamily: {
				'sans': ['Montserrat', 'system-ui', 'sans-serif'],
				'mono': ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
				'editorial': ['Georgia', 'Cambria', '"Times New Roman"', 'serif'],
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
