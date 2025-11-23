# Review Generator Dev Tool

A fully static development tool for experimenting with match review generation settings for Scout for LoL. No backend or server required!

## Features

- **Configuration Management**: Tweak AI model settings, prompts, personalities, and art styles
- **Tab-Based Workflow**: Compare multiple configurations side-by-side
- **Personality Editor**: Create, edit, and manage custom reviewer personalities
- **Cost Tracking**: Real-time cost calculation for API usage
- **S3 Integration**: Browse and test with real match data from S3
- **Result Comparison**: Side-by-side view of generated reviews and images
- **Export/Import**: Save and share configurations

## Getting Started

### Prerequisites

- Bun runtime
- OpenAI API key (for text generation)
- Gemini API key (for image generation)
- AWS credentials (optional, for S3 match browsing)

### Installation

From the workspace root:

```bash
bun install
```

### Development

```bash
cd packages/review-dev-tool
bun run dev
```

The app will be available at `http://localhost:4321`

### Configuration

1. **API Settings**: Enter your OpenAI and Gemini API keys in the settings panel
2. **Text Generation**: Configure model, temperature, max tokens, and other parameters
3. **Image Generation**: Enable/disable, select model, choose art styles
4. **Prompts**: Customize base prompt and select personality

### Usage

1. **Configure Settings**: Adjust parameters in the left panel
2. **Select Match**: Browse S3 matches or use example data
3. **Generate Review**: Click "Generate Review" to create a review with current settings
4. **View Costs**: Track API costs in real-time

### Features Detail

#### Tab System

- Create up to 5 configuration tabs
- Compare results across different settings
- Double-click tab names to rename

#### Personality Editor

- **Create Custom Personalities**: Define new reviewer personalities from scratch
- **Edit Personalities**: Modify instructions, description, favorite champions/lanes
- **Delete Custom Personalities**: Remove personalities you've created
- **Built-in Personalities**: 4 pre-built personalities (Aaron, Brian, Irfan, Nekoryan)
- **Custom Storage**: Custom personalities stored in browser localStorage
- **Full Control**: Edit system prompt instructions and metadata

Access the personality editor via:

- "Manage Personalities" button in the header
- "Manage" button next to personality dropdown in settings

#### Match Browser

- Browse recent matches from S3 (requires CORS configuration on bucket)
- Filter by queue type
- Preview match metadata
- Direct client-side S3 access (no backend proxy needed)

#### Cost Tracking

- Per-request cost breakdown
- Session total tracking
- Export cost reports

#### Comparison View

- Side-by-side configuration comparison
- Highlight differences
- Session summary

## Security Note

⚠️ This tool stores API keys in browser localStorage and is intended for **local development only**. Do not deploy this tool to production or share your API keys.

### S3/R2 CORS Configuration

If you want to browse matches from S3/R2, you'll need to configure CORS on your bucket to allow browser access. Example CORS configuration:

```json
[
  {
    "AllowedOrigins": ["http://localhost:4321"],
    "AllowedMethods": ["GET", "HEAD"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": [],
    "MaxAgeSeconds": 3600
  }
]
```

For production deployments, update `AllowedOrigins` to match your domain.

## Development

### Project Structure

```
src/
├── components/     # React UI components
├── config/        # Configuration schemas
├── data/          # Art styles and themes data
├── lib/           # Core logic (generator, costs, S3, etc.)
├── pages/         # Astro pages
└── prompts/       # Prompt templates and personalities
```

### Key Technologies

- **Astro** - Static site framework (no server/backend)
- **React** - UI components
- **Tailwind CSS** - Styling
- **OpenAI SDK** - Text generation (client-side)
- **Google Generative AI** - Image generation (client-side)
- **AWS SDK** - S3 integration (client-side)
- **Zod** - Validation

### Architecture

This is a **fully static application** that runs entirely in the browser:

- No backend server required
- All API calls (OpenAI, Gemini, S3) happen client-side
- All data stored in browser (localStorage, IndexedDB)
- Can be deployed to any static hosting service (GitHub Pages, Netlify, Vercel, etc.)

## License

See parent project for license information.
