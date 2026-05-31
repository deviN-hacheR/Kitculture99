# JerseyHub — Online Jersey Shop Website

A modern, mobile-friendly website for selling custom and ready-made sports jerseys online.

## Features

- **Product catalog** — Browse jerseys by sport (football, basketball, cricket)
- **Shopping cart** — Add items, pick sizes, adjust quantities (saved in browser)
- **WhatsApp checkout** — Orders go straight to WhatsApp with a pre-filled message
- **Custom orders section** — Promote team/bulk jersey printing
- **Contact form** — Sends inquiries via WhatsApp
- **Fully responsive** — Works on phones, tablets, and desktop

## Quick Start

1. Open `index.html` in any web browser, or run a local server:

   ```bash
   cd website
   npx serve .
   ```

2. Customize the site (see below).

3. Deploy to [Netlify](https://netlify.com), [Vercel](https://vercel.com), or [GitHub Pages](https://pages.github.com) — just upload the `website` folder.

## Customization

### Business details

Edit the `CONFIG` object at the top of `app.js`:

```javascript
const CONFIG = {
  businessName: 'Your Shop Name',
  whatsappNumber: '1234567890',  // country code + number, no + or spaces
  currency: '$',
  products: [ /* your products */ ],
  sizes: ['S', 'M', 'L', 'XL', 'XXL']
};
```

### Brand name & contact info

Update these in `index.html`:

- Logo text (`JerseyHub` → your brand)
- WhatsApp link and phone number
- Email and Instagram links
- Footer copyright

### Products

Add or edit products in `app.js` under `CONFIG.products`. Each product needs:

| Field       | Description                          |
|------------|--------------------------------------|
| `id`       | Unique number                        |
| `name`     | Product name                         |
| `category` | `football`, `basketball`, or `cricket` |
| `price`    | Price (number)                       |
| `emoji`    | Placeholder icon (replace with images later) |
| `badge`    | Optional label: `New`, `Bestseller`, etc. |
| `description` | Short product description         |

### Real product photos

Replace emoji placeholders by adding an `image` field to products and updating the product card HTML in `app.js` to use `<img src="...">` instead of emoji.

### Colors & styling

Main colors are in `styles.css` under `:root`:

- `--accent` — Primary brand color (default: teal `#00d4aa`)
- `--bg-dark` — Background color

## File Structure

```
website/
├── index.html    # Main page
├── styles.css    # All styling
├── app.js        # Products, cart, checkout logic
└── README.md     # This file
```

## Next Steps (Optional)

- Add real product photos
- Connect a payment gateway (Stripe, PayPal)
- Add an admin panel to manage products
- Hook up Firebase for order tracking (you already have Firebase in this project)
- Add a size guide page
- Set up a custom domain
