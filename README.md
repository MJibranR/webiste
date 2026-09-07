# Spider Hex

Create a complete Next.js 14 web application called "SPIDER HEX" - a premium gaming panel store with admin panel, user authentication, and download management system.

## PROJECT OVERVIEW
A dark-themed, cyber/hex style gaming panel store where users can browse, purchase (via WhatsApp/Discord), and download gaming panels. Includes a complete admin panel for product and download management.

## DESIGN REQUIREMENTS
- Dark theme with matrix/hex background (#0a0a0f, #0d0d14, #1a1a2e)
- Primary colors: #00ff41 (matrix green), #ff0044 (red), #ffd700 (gold)
- Font: Monospace/Courier style with glitch effects
- Spider/Hex iconography with 🕷️ emoji branding
- Glow effects, scanlines, and pulse animations
- Responsive design for all screen sizes

## PAGES & FEATURES

### 1. Landing Page (/)
- Navigation bar with SPIDER HEX logo and Login/Signup buttons
- Hero section with glitch text "SPIDER HEX"
- Stats: 80K+ Active Players, 50K+ Gift Keys, 99.9% Uptime
- 4 feature cards: Lightning Fast, Ultra Secure, Premium Quality, Next Level
- "Secure Access" card with Login and Signup buttons
- Footer with "syntaxcorporation.online" link

### 2. Login Page (/login)
- Email/Username and Password fields
- Show/hide password toggle
- "Forgot Password" link
- Cloudflare Turnstile style verification
- Login button with loading state
- Switch to Signup link

### 3. Signup Page (/signup)
- Full Name, Email Address, WhatsApp Number fields
- Password and Confirm Password with show/hide
- Human verification with key display
- Create Account button
- Back to Store link

### 4. Customer Dashboard (/dashboard)
- **Sidebar**: Profile avatar, username, level/XP, navigation links (Dashboard, Downloads, History, Store, WhatsApp)
- **Wallet Section**: Available balance, Total spent, Quick top-up buttons ($5, $10, $25, $50) that open WhatsApp with pre-filled message
- **Active Licenses**: Shows purchased panels with status, purchase date, and download button if link is available
- **Quick Actions**: Browse Store and My Downloads cards

### 5. Downloads Page (/dashboard/downloads)
- List of all purchased panels with download links
- Each purchase shows: product name, price, purchase date, status (ACTIVE/EXPIRED)
- Download button appears when admin adds link
- "No downloads" state with link to store

### 6. Purchase History (/dashboard/purchases)
- Complete list of all purchases with status
- Shows product name, price, date, and status badge

### 7. Store Page (/store)
- Category filters: ALL, PC PANEL, NON ROOT, ROOT, IOS PANEL, OTHERS ITEM
- Product grid with: badge, name, category, price, BUY button
- Buying opens WhatsApp with pre-filled message or copies to clipboard for Discord
- Each purchase automatically creates a license record

### 8. Admin Panel (/admin) - Protected Route
- **Admin Dashboard**: Stats cards (Products, Users, Purchases, Active Licenses)
- Quick action cards: Manage Products, Manage Downloads
- Recent activity feed

### 9. Admin Products (/admin/products)
- Add Product form: Name, Price, Category, Badge
- Edit and Delete functionality
- Product list with all details

### 10. Admin Downloads (/admin/downloads)
- List all active purchases
- Add/Edit download links for purchased items
- Customers instantly see download links on their dashboard

### 11. Admin Users (/admin/users)
- List all registered users
- Show name, email, level, balance, WhatsApp
- User management view

## AUTHENTICATION SYSTEM
- Uses AuthContext with localStorage persistence
- Roles: admin and user
- Default admin: email: admin@spiderhex.com, password: admin123
- Users stored in localStorage
- Auto-login after signup

## CORE FUNCTIONALITY

### Product Management
- Products stored in localStorage
- Each product: id, name, price, category, badge, inStock, downloadLink
- Admin can add, edit, delete products

### Purchase System
- When user clicks BUY, purchase is recorded with: id, userId, productId, productName, price, purchaseDate, status, downloadLink
- Purchase opens WhatsApp with message: "Hello I'm [name] I want to buy [product] panel for pc/ios/android for lifetime for $[price] USD thank you!"
- Discord option copies message to clipboard and opens Discord

### Download Management
- Admin adds download links to purchases
- Customer sees download button on Dashboard and Downloads page
- Links open in new tab

## WHATSAPP/DISCORD INTEGRATION
- WhatsApp: https://wa.me/?text={encoded_message}
- Discord: copies message to clipboard + opens discord.com/app
- Top-up messages include email for verification

## STYLING REQUIREMENTS
- Matrix rain effect background
- Glitch text animation
- Pulse glow borders
- Status dots with pulsing animation
- Scanline overlay effect
- Hex pattern background
- Monospace font throughout
- Hover effects on all interactive elements

## DATA STRUCTURES

### User
{
  email, fullName, whatsapp, password, role: 'admin'|'user',
  balance: 0, level: 1, xp: 0, username, licenses: []
}

### Product
{
  id, name, price, category, badge, inStock: true, downloadLink: ''
}

### Purchase
{
  id, userId, productId, productName, price, purchaseDate, status: 'active'|'expired', downloadLink: ''
}

## DEPENDENCIES
- next@14.0.4
- react@18
- react-dom@18
- @fortawesome/fontawesome-svg-core@6.5.1
- @fortawesome/free-solid-svg-icons@6.5.1
- @fortawesome/free-brands-svg-icons@6.5.1
- @fortawesome/react-fontawesome@0.2.0

## FILE STRUCTURE

app/
├── layout.js
├── page.js (Landing)
├── login/page.js
├── signup/page.js
├── dashboard/page.js
├── dashboard/downloads/page.js
├── dashboard/purchases/page.js
├── store/page.js
├── admin/page.js
├── admin/products/page.js
├── admin/downloads/page.js
├── admin/users/page.js
├── globals.css
├── components/
│ └── (No separate components needed - all in pages)
└── context/
└── AuthContext.js



## SPECIAL INSTRUCTIONS
1. All data persistence uses localStorage (no database needed)
2. Admin credentials: admin@spiderhex.com / admin123
3. Include "syntaxcorporation.online" link in footer
4. No payment gateway - all purchases via WhatsApp/Discord
5. Use FontAwesome icons for all icons
6. Make it fully responsive
7. Include all animations and glow effects
8. Dark/cyber theme throughout
9. Add favicon using 🕷️ emoji

Create the complete application with all files, styling, and functionality described above. Make it production-ready with proper error handling, loading states, and responsive design.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/47b90a71-144f-4928-a4c0-da5d9c4c9f44).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
