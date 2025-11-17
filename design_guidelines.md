# QuietPrayers Enhancement Design Guidelines

## Design Approach
**Enhancement Mode**: Seamlessly integrate new features while preserving the existing visual language and component structure of QuietPrayers. Maintain spiritual, calming aesthetic throughout.

## New Feature Integration

### 1. Cloud Header Image
- **Placement**: Full-width hero section at the very top
- **Style**: Soft, peaceful cloud photograph - dawn/dusk tones preferred
- **Height**: 40vh on desktop, 30vh on mobile
- **Overlay**: Subtle gradient overlay (white to transparent, top to bottom) to ensure text readability
- **Content Over Image**: App title/logo centered, use blur backdrop for any text containers

### 2. Daily Inspiration Section
- **Location**: Immediately below cloud header, before prayer feed
- **Layout**: Centered card with gentle shadow, distinct from prayer cards
- **Typography**: Larger, serif font for the quote/verse (emphasize reverence)
- **Visual Treatment**: Light background, include small decorative element (dove, cross, or rays icon)
- **Spacing**: Generous padding (py-8 to py-12), isolated from other content
- **Attribution**: Small italic text for verse reference or author
- **Rotation Indicator**: Subtle "Daily" or date badge in corner

### 3. Prayer Card Enhancements

**"Lift it Up" Button**:
- Position: Bottom-left of prayer card, alongside timestamp
- Style: Icon + count (praying hands emoji/icon + number)
- States: Inactive (outlined), Active (filled with soft glow)
- Animation: Gentle pulse on click, count increments smoothly
- Size: Compact but touch-friendly (minimum 44px tap target)

**Bookmark Button**:
- Position: Top-right corner of prayer card
- Style: Bookmark ribbon icon
- States: Unfilled outline (not saved), Filled (saved)
- Color: Subtle gold/amber when active
- No label needed - icon is self-explanatory

**Social Share Button**:
- Position: Bottom-right of prayer card
- Style: Share icon with subtle text "Share"
- Functionality: Triggers share menu with image preview
- Size: Same as "Lift it Up" button for balance

### 4. Shareable Prayer Card Image Design
- **Format**: Square or 4:5 ratio optimized for social platforms
- **Background**: Soft gradient or cloud texture (matches header aesthetic)
- **Typography**: Prayer text in readable serif font, white or dark gray
- **Branding**: Small "QuietPrayers" watermark at bottom
- **Padding**: Generous margins ensuring text doesn't touch edges
- **Max Text Length**: Truncate long prayers with "..." and "Read more on QuietPrayers"

### 5. Content Moderation Visual Feedback
- **Submission Flow**: No visible moderation UI for users
- **Approved**: Prayer appears normally in feed
- **Flagged/Rejected**: User sees gentle message: "Your prayer is being reviewed. Thank you for your patience."
- **Tone**: Encouraging, never accusatory

## Spacing & Layout Consistency
- Maintain existing card spacing (likely gap-4 to gap-6)
- New buttons use same padding scale as existing UI
- Daily Inspiration section gets extra vertical margin for separation (mt-8, mb-6)
- Cloud header has no bottom margin (flows directly into content)

## Typography Hierarchy
- **Cloud Header Text**: Existing app title size
- **Daily Inspiration**: 1.25-1.5x prayer text size, different font family
- **Prayer Text**: Existing size maintained
- **Button Labels**: Existing button text sizing
- **Share Card Typography**: Optimized for readability at social media sizes (18-24px)

## Color Additions (Minimal)
- Bookmark active: Warm gold (#F59E0B or similar)
- "Lift it Up" active: Soft blue glow or existing primary color
- Daily Inspiration background: Very light tint of primary color
- Share card background: Cloud photo or gradient matching header

## Images Required
1. **Cloud Header**: Peaceful sky with clouds, soft colors, horizontal crop
2. **Share Card Background**: Subtle texture or solid color variant
3. **Icons**: Praying hands, bookmark ribbon, share arrow (use icon library)

## Critical Interaction Notes
- All new buttons maintain existing hover/active states pattern
- "Lift it Up" count updates in real-time without page refresh
- Bookmark state persists across sessions
- Share generates image server-side before presenting share options
- Daily Inspiration rotates once per day (not on every page load)

## Mobile Adaptations
- Cloud header reduces to 30vh
- Daily Inspiration card maintains full width with side padding
- Prayer card buttons stack vertically if needed on very small screens
- Share card image remains square for optimal mobile sharing