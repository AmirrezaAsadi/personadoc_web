# PersonaDock Sharing Guide

## How to Share a Persona

PersonaDock provides comprehensive sharing capabilities for your personas, allowing you to control who can access and interact with your created personas.

### 🔐 **Sharing Options**

#### 1. **Public Sharing**
- **What it is**: Makes your persona visible to all PersonaDock users
- **How to enable**: Toggle the "Make Public" switch in the sharing panel
- **Benefits**: 
  - Appears in the public persona gallery
  - Discoverable through search
  - Helps build the community knowledge base
- **Control**: You can toggle public visibility on/off at any time

#### 2. **Private Link Sharing**
- **What it is**: Generates a unique, private link that can be shared with specific people
- **How to use**: Click "Generate Share Link" in the sharing panel
- **Benefits**:
  - Share with specific individuals without making public
  - No account required for viewers to access
  - Track how many times the link has been accessed
- **Control**: You can revoke the link at any time, making it inaccessible

#### 3. **Comment Permissions**
- **What it is**: Allow viewers to leave comments on your shared persona
- **How to enable**: Toggle "Allow Comments" in the sharing panel
- **Use cases**: 
  - Gather feedback during research
  - Collaborative persona development
  - Community engagement

### 🎯 **Step-by-Step: How to Share a Persona**

#### **Step 1: Open Your Persona**
1. Go to the PersonaDock home page
2. Click on any persona you've created (marked with "Mine" badge)
3. This opens the detailed persona view

#### **Step 2: Access Sharing Controls**
1. In the persona header (top right), you'll see the sharing component
2. Look for the share icon (📤) next to the persona information
3. Click on it to open the sharing panel

#### **Step 3: Configure Sharing Settings**

**For Public Sharing:**
1. Toggle "Make Public" to ON
2. Your persona will immediately appear in:
   - Public persona gallery (`/public-personas`)
   - Search results for all users
   - Community recommendations

**For Private Link Sharing:**
1. Click "Generate Share Link"
2. A unique URL will be created (e.g., `https://personadock.com/shared/abc123`)
3. Copy and share this link with specific people
4. Track access count in the sharing panel

**For Comments:**
1. Toggle "Allow Comments" to enable/disable
2. When enabled, viewers can leave feedback
3. Comments appear below the persona information

#### **Step 4: Manage Your Shared Personas**
- **View Share Statistics**: See how many times your persona has been accessed
- **Revoke Access**: Turn off public sharing or revoke share links
- **Update Permissions**: Change comment settings at any time

### 📊 **Understanding Access Types**

When you view personas on the home page, you'll see different badges:

- **🔵 Mine**: Personas you created and own
- **🟢 Public**: Publicly shared personas from other users  
- **🟣 Shared**: Personas shared with you via private links

### 🔍 **Finding Shared Personas**

#### **Public Persona Gallery**
- Visit `/public-personas` to browse all public personas
- Use search and filters to find specific types
- See creator information and access counts

#### **Home Page Filters**
1. Use the filter tabs: "All", "My Personas", "Public", "Shared with Me"
2. Search across all accessible personas
3. View access type badges on each persona card

#### **Direct Share Links**
- When someone shares a private link with you
- Click the link to view the persona (no account required)
- See a read-only view with creator attribution

### 🛡️ **Privacy & Security**

#### **What You Control:**
- ✅ Public visibility (on/off)
- ✅ Share link generation/revocation
- ✅ Comment permissions
- ✅ Full editing rights to your personas

#### **What Others Can See:**
**Public Personas:**
- Full persona details (name, traits, interests, etc.)
- Your name as the creator
- Access statistics

**Private Shared Personas:**
- Same as public, but only accessible via the specific link
- Not discoverable through search or gallery

#### **What Others Cannot Do:**
- ❌ Edit your persona
- ❌ Delete your persona  
- ❌ Access your private personas without a link
- ❌ See personas you haven't shared

### 💡 **Best Practices**

#### **For Public Sharing:**
- ✅ Share well-developed, complete personas
- ✅ Use clear, descriptive names
- ✅ Include comprehensive personality traits and interests
- ✅ Enable comments for community feedback

#### **For Private Sharing:**
- ✅ Use for work-in-progress personas
- ✅ Share with collaborators and stakeholders
- ✅ Generate new links for different groups
- ✅ Revoke links when no longer needed

#### **For Research & Collaboration:**
- ✅ Enable comments to gather feedback
- ✅ Share personas with research participants
- ✅ Use public sharing to build a knowledge base
- ✅ Track access statistics to measure engagement

### 🔧 **Technical Details**

#### **Share Link Format:**
- Pattern: `https://personadock.com/shared/{unique-token}`
- Tokens are cryptographically secure and unique
- Links work immediately after generation
- Revoked links return a "not found" error

#### **Access Tracking:**
- View counts are updated each time someone accesses the link
- Statistics show total access count (not unique visitors)
- Available in the sharing panel and persona details

#### **Search & Discovery:**
- Public personas are indexed for search
- Search works across name, occupation, location, traits, and interests
- Filters allow browsing by access type
- Real-time search with debouncing for performance

### 🎨 **UI Components**

The sharing functionality is integrated throughout the app:

1. **PersonaSharing Component**: Main sharing controls in persona detail view
2. **Filter Tabs**: Home page persona type switching
3. **Access Badges**: Visual indicators on persona cards
4. **Public Gallery**: Dedicated page for browsing public personas
5. **Shared View**: Read-only page for share link access

### 🚀 **Future Enhancements**

Planned improvements include:
- Collaboration features for shared personas
- Advanced comment system with threading
- Persona collections and favorites
- Social features (following creators, recommendations)
- Analytics dashboard for creators
- Integration with external sharing platforms

---

*This sharing system makes PersonaDock a powerful platform for both individual persona development and collaborative research, while maintaining full control over your intellectual property and privacy.*
