# Offline Multimedia Library

# TOME — Product Requirements Prompt (PRP)

## 1. Role and objective

Act as a senior product engineer, desktop application architect, UI/UX designer, and technical lead. Your task is to design and build **Tome**, a premium, local-first multimedia book creator and reader for Windows and macOS.

Do not stop at producing a plan. First evaluate technical feasibility, choose and justify the architecture, define implementation milestones, and then begin building the application in manageable stages.

Work directly in the project repository when a development environment is available. Produce working, testable software rather than mockups or placeholder screens.

The developer prefers practical, straightforward explanations and is not necessarily an experienced programmer. Explain important technical decisions in plain language.

## 2. Product overview

**Product name:** Tome

**Tagline concept:** Your files, bound together.

**One-sentence description:** Tome transforms locally stored documents, images, audio, video, and text into beautiful, customizable multimedia books with realistic page-turning interactions.

Tome is a personal digital library, multimedia scrapbook, document reader, and lightweight book editor combined into one cohesive desktop experience.

The defining idea is that users should no longer experience their documents and media as disconnected files. They should be able to assemble them into personalized books that look and feel like thoughtfully designed physical books.

## 3. Non-negotiable product principles

1. **Local-first:** User content, books, metadata, and edits remain on the user's computer.
2. **Offline operation:** All core features must work without an internet connection after installation.
3. **Privacy:** No accounts, cloud storage, AI APIs, analytics, telemetry, or mandatory network requests.
4. **Non-destructive imports:** Imported files are copied into Tome's managed local library. Original source files remain untouched.
5. **Beautiful by default:** Favor refined typography, whitespace, subtle animation, and clean layouts.
6. **Reading first:** The reading experience must remain immersive and distraction-free.
7. **One book, mixed media:** A book can contain multiple file types, organized in the order the user chooses.
8. **Reliable persistence:** Changes save automatically, and users can resume where they left off.
9. **Real functionality:** Avoid fake controls, decorative-only interactions, and features that appear implemented but do not work.
10. **Maintainability:** Prefer reliable, well-supported libraries over unnecessarily complicated custom implementations.

## 4. Target audience

Tome is intended for people who collect, read, study, research, document, and organize digital content, including:

- Readers with collections of PDFs and EPUB ebooks.
- Students organizing textbooks, lecture notes, diagrams, and recordings.
- Researchers combining documents, reference images, and audio notes.
- Journalers and personal archivists building multimedia collections.
- Creatives collecting visual references, written material, and videos.
- Anyone who prefers a beautiful personal library to an ordinary file manager.

The product should be approachable for nontechnical users.

## 5. Platform and distribution

### Target platforms

- Windows desktop.
- macOS desktop.

### Distribution model

Tome will be distributed directly through a public GitHub repository and GitHub Releases. It will not be published through app stores or hosted as a web service.

Expected user experience:

1. Download the appropriate release for their operating system.
2. Install or launch the application.
3. Open Tome.
4. Create a book and import local files.
5. Use the application offline.

Provide platform-appropriate distributables, such as a Windows installer or executable and a macOS application bundle or disk image.

Keep the source code in the repository and distribute ready-to-run builds through releases. Document build prerequisites and provide clear setup instructions.

Investigate code signing and macOS notarization requirements. Do not promise warning-free installation without the necessary certificates and signing process.

## 6. Technical architecture

### Preferred starting point

Evaluate the following stack first:

- **Desktop shell:** Tauri.
- **Frontend:** React.
- **Language:** TypeScript.
- **Build tooling:** Vite.
- **Local structured storage:** SQLite or another justified embedded database.
- **Document rendering:** PDF.js or an appropriate alternative.
- **PDF manipulation:** A suitable maintained PDF library.
- **Rich content editing:** A block-based editor such as Tiptap, if compatible with the chosen architecture.
- **Page-turning interaction:** A maintained page-flip library, if it meets the product's rendering requirements.
- **3D bookshelf:** CSS 3D transforms or a lightweight rendering approach where sufficient.

These are candidates, not mandatory dependencies.

Before committing to the stack, compare the options against:

- Windows and macOS compatibility.
- Offline operation.
- Document-rendering fidelity.
- Page-turn animation quality.
- Local filesystem access and security.
- Performance with large PDFs and media.
- Build complexity and packaging.
- Dependency health, licensing, and maintenance.
- Integration compatibility between the selected libraries.

Tauri + React + TypeScript is the preferred starting point, but the architect must make the final decision based on evidence. Consider Electron or another suitable alternative if a material requirement cannot be met reliably.

Do not build a custom PDF renderer, EPUB engine, video player, or page-flip physics engine from scratch unless existing solutions demonstrably cannot satisfy the requirements.

## 7. Information architecture

Tome should have the following primary areas:

1. **Library:** The user's personal bookshelf and collection manager.
2. **Book reader:** A distraction-free environment for reading and navigating a book.
3. **Book editor:** Tools for importing, arranging, and editing content.
4. **Collections:** Folders, tags, search, sorting, and recently opened books.
5. **Settings:** Reading preferences, appearance, and local storage information.

Keep navigation restrained and visually quiet. Do not turn the library into a conventional file manager.

## 8. First-launch experience

On the first launch, provide three complementary elements.

### Welcome letter

Show a short, beautifully typeset welcome letter explaining:

- How to create a book.
- How to upload a cover.
- How to import files.
- How to reorder content.
- How to switch between Read and Edit modes.
- Where the library is stored locally.

This should feel like opening the first page of a book, not completing a mandatory onboarding wizard.

### Optional sample book

Include a sample book that demonstrates the product's capabilities with representative content, such as:

- A document page.
- Images.
- A text page.
- An audio player.
- A video player.
- Mixed-media page layouts.

Use original or appropriately licensed sample assets. Make the sample removable and do not mix its content into the user's books without permission.

### Main library

After onboarding, show the personal library with a clear create-book action. Returning users should go directly to their existing library rather than seeing the welcome experience repeatedly.

## 9. Library and bookshelf

### Default view: Minimal grid

Display books in a clean, responsive grid.

Each book should support:

- A user-defined title.
- An optional uploaded cover image.
- A generated fallback cover when no image is supplied.
- A subtle visual treatment with restrained shadows and hover feedback.
- Basic metadata, such as recently opened status.

When a user uploads a cover, fit it to the book's front-cover thumbnail using an appropriate crop or contain mode. Preserve the original uploaded image in local storage and allow the user to replace the cover.

### Optional view: 3D bookshelf

Provide a toggle between the default grid and an optional realistic 3D bookshelf.

The 3D view should feature:

- Books with convincing proportions and subtle depth.
- Uploaded covers on the front faces.
- Restrained shadows and perspective.
- Clear hover and selection states.
- Responsive interactions.
- Acceptable performance on ordinary computers.

The grid must remain available as a lightweight alternative. The 3D view must not compromise the reader's performance.

### Library organization

Implement:

- Collections or folders.
- Tags.
- Search by book title and relevant metadata.
- Sorting by title, creation date, and recently opened.
- Recently opened books.
- Book creation, renaming, deletion, and cover replacement.

Ask for confirmation before destructive deletion. Clearly distinguish removing a book from deleting shared content or application files.

## 10. Book creation and content importing

Users can create multiple independent books.

A typical workflow:

1. Click Create Book.
2. Enter a title.
3. Optionally upload a cover image.
4. Import files from their computer.
5. Arrange imported content.
6. Open the book in Read mode or Edit mode.

Users must be able to return to the library, create another book, and populate it with an entirely different collection of content.

### Supported import formats

Version 1 must support:

- PDF documents.
- Images: JPG, JPEG, PNG, WebP.
- Audio: MP3, WAV, M4A, and additional formats supported by the selected playback engine.
- Video: MP4, WebM, and additional formats supported by the selected playback engine.
- Plain text: TXT.
- Markdown: MD.
- Word documents: DOCX.
- EPUB ebooks.

Check actual format and codec compatibility instead of promising universal playback. Display a useful error for unsupported or corrupted files.

### Copy-on-import behavior

Imported content must be copied into Tome's managed application-data library.

Requirements:

- The original file stays in its original location.
- Tome reads and edits the managed copy, not the original.
- Moving or deleting the original must not break the imported content.
- Avoid unnecessarily duplicating files inside the managed library when a file is referenced multiple times within the same book.
- Handle large files and interrupted imports safely.
- Display useful progress feedback for long imports.
- Sanitize filenames and handle duplicate filenames.
- Do not silently overwrite existing content.

The app must not require users to configure their own storage directories or understand filesystem internals to get started.

## 11. The book data model

A book is a persistent, editable collection of heterogeneous content.

A conceptual structure:

- **Book:** ID, title, cover reference, collection, tags, creation timestamp, modification timestamp, reading preferences.
- **Content item:** ID, parent book, item type, title, ordering, source metadata, local asset reference.
- **Page or block:** ID, parent content item or custom page, type, ordering, serialized content, associated assets.
- **Annotation:** ID, document reference, page reference, annotation type, coordinates or text range, content, timestamps.
- **Reading state:** Book ID, content item ID, page or chapter position, scroll position where applicable, zoom, layout, media position.
- **Preferences:** Theme, typography, navigation settings, and other relevant local choices.

This is a conceptual schema, not a demand to implement every field literally. Choose a normalized, maintainable schema that supports the requirements.

Persist relationships between books and assets so renaming a file or moving an internal asset does not corrupt the library.

## 12. Unified mixed-media book experience

The most distinctive feature of Tome is that one book can contain multiple kinds of content.

For example:

1. A PDF textbook.
2. An audio recording.
3. A collection of images.
4. A video.
5. A Markdown note.
6. An EPUB or DOCX document.

Users control the order of these items.

### Important distinction: book pages and document pages

Do not treat every imported file as a single flat page.

A PDF contains its own pages. EPUBs contain structured chapters and text. DOCX documents have their own formatting and pagination. Audio and video require playback interfaces. Images and text can be placed into custom pages.

The implementation must model these differences explicitly.

### Custom scrapbook pages

Users can create custom pages containing multiple content blocks.

Supported block types should include:

- Text.
- Images.
- Audio players.
- Video players.
- Other supported embedded content where practical.

Use a block-based editing model inspired by Notion rather than a freeform design canvas.

Blocks should automatically align and flow into a clean page layout. Users should be able to insert, reorder, resize where appropriate, and remove blocks.

Prioritize readable layouts, sensible spacing, predictable page boundaries, and consistent typography.

Do not require users to manually position every element.

### Reading presentation

Present the book as a cohesive reading experience.

- Custom pages should feel like pages in a book.
- Images should display cleanly without unintended distortion.
- Audio should use an integrated player.
- Video should play inside an integrated media view.
- Text should be typeset for comfortable reading.
- Imported documents should render using their native structure as far as possible.
- Navigation should make transitions between different content types understandable.

Audio and video should not autoplay unexpectedly. Respect the user's explicit playback controls.

## 13. PDF handling and editing

PDF is a core format and requires meaningful editing functionality.

### Rendering

- Render pages accurately.
- Preserve original document layout.
- Support zoom and appropriate page layouts.
- Support navigation through individual pages.
- Handle large PDFs without loading every page at full resolution simultaneously.

### Required editing operations

Implement:

1. Reorder pages.
2. Delete pages.
3. Insert pages from other PDFs.
4. Insert images as pages.
5. Rotate pages.
6. Highlight PDF content.
7. Draw annotations.
8. Add notes.

### Visual page editor

Provide a page-thumbnail interface that lets users inspect and rearrange document pages.

Users should be able to:

- Select pages.
- Drag pages into a different order.
- Delete selected pages.
- Insert new pages.
- Rotate pages.
- Annotate pages.
- See a clear indication of the current selection.

### Annotation persistence

Annotations must survive closing and reopening the app.

Preserve annotation positioning relative to the correct document page. Support saving annotations into the managed document or a robust local annotation layer, depending on the selected library.

Prefer standards-compatible PDF annotations where feasible.

### Non-destructive behavior

All operations apply to Tome's managed copy. The original imported PDF must never be modified.

Avoid silently flattening annotations or destroying editable information.

### Editing scope boundary

Version 1 does not need to support arbitrary rewriting of existing text inside a PDF.

Editing existing PDF text is distinct from page management and annotation. Do not misrepresent the supported editing tools as a full PDF text editor.

## 14. EPUB handling

EPUB files should be treated as structured ebooks, not as ordinary images or opaque attachments.

Requirements:

- Render text and chapter structure.
- Support table of contents navigation.
- Preserve the source's typography and layout as far as practical.
- Provide appropriate reading navigation.
- Persist the user's reading position.
- Support local offline reading.
- Handle embedded images and fonts when permitted by the format and implementation.

The interface may use Tome's book-reading presentation, but it must not force EPUB content into an inaccurate fixed-page layout if the rendering engine uses reflowable text.

## 15. DOCX handling

DOCX files must display their actual contents as readable, formatted documents.

Do not show only a filename, icon, or raw extracted text.

Requirements:

- Render paragraphs, headings, lists, tables, and images where supported.
- Preserve formatting as closely as practical.
- Present the document within the unified book-reading experience.
- Support navigation and page-level viewing.
- Keep rendering local and offline.
- Handle long documents efficiently.

### Pagination and compatibility

DOCX pagination depends on fonts, layout engines, and page-rendering methods. Evaluate a reliable offline rendering solution before implementation.

Do not assume that an HTML conversion automatically preserves exact Word pagination.

Choose and document a practical rendering strategy, and test representative DOCX documents with headings, tables, images, page breaks, and mixed formatting.

Full Word-style editing of the internal DOCX document is not required for version 1. The primary requirement is accurate local reading and integration into the book.

## 16. Images, audio, video, and text

### Images

- Display JPG, JPEG, PNG, and WebP.
- Preserve aspect ratios.
- Support useful fitting and zoom behavior.
- Allow images to appear in custom scrapbook pages.
- Support image-based cover uploads.

### Audio

- Provide integrated playback controls.
- Support play, pause, seek, duration, and playback position where supported.
- Display a clean audio block with available metadata.
- Restore the last playback position when the user reopens the relevant book.
- Never autoplay without an explicit user action.

### Video

- Embed a local video player.
- Support common formats and codecs supported by the chosen media engine.
- Provide playback controls and seeking.
- Restore playback position.
- Handle unsupported codecs gracefully.
- Avoid unnecessary transcoding or network services.

### TXT and Markdown

- Render plain text cleanly.
- Render Markdown formatting where appropriate.
- Support inserting text content into custom scrapbook pages.
- Preserve original imported files.
- Provide appropriate typography and spacing.

## 17. Reading mode

Books open in a dedicated, distraction-free Read mode.

### Visual treatment

- Clean white and soft-gray surfaces.
- Generous whitespace.
- Refined typography.
- A restrained toolbar.
- Subtle shadows and page depth.
- No persistent clutter or oversized controls.

### Page turning

Implement realistic animated page curls to evoke turning a physical book.

Interaction requirements:

- Click navigation.
- Previous and next controls.
- Keyboard navigation.
- Appropriate handling of the beginning and end of a book.
- Smooth animations.
- Reduced-motion or simplified-transition support where feasible.
- No accidental page turns when interacting with embedded players or text controls.

Prefer a maintained page-flip library when it supports the required content model. Validate compatibility with the chosen desktop framework before committing to it.

Do not force PDFs, EPUBs, DOCX documents, and custom scrapbook pages into identical rendering mechanics when their content structures differ.

The goal is a consistent reading experience, not identical internal rendering for every format.

### Reading controls

Keep controls minimal and discoverable.

Provide:

- A clear Edit button.
- A way to return to the library.
- Previous/next navigation.
- A page or position indicator when applicable.
- Useful navigation for long documents.
- Zoom and layout controls where appropriate.

Avoid permanent sidebars that compete with the content.

## 18. Dedicated Edit mode

Read and Edit modes must be clearly separated.

### Read mode

- Focuses on consuming content.
- Hides editing controls.
- Prioritizes typography, layout, and page turns.
- Allows users to navigate between content items.

### Edit mode

- Provides a simple content list.
- Provides a visual page editor.
- Allows file importing.
- Supports content reordering.
- Supports custom scrapbook page creation.
- Provides document-specific editing tools.
- Allows users to change the book title and cover.
- Supports block insertion and deletion.

The content list should make the order of imported items easy to understand and modify.

The visual page editor should expose document page thumbnails and custom-page blocks without becoming a complex professional publishing suite.

Changes should be reflected in Read mode immediately after saving.

## 19. Persistence and restoration

Tome must save changes automatically. Do not add a prominent Save button to the primary workflow.

Automatically persist:

- Book titles.
- Cover images.
- Book collections and tags.
- Content ordering.
- Imported asset references.
- Custom page layouts.
- Supported PDF page modifications.
- PDF annotations.
- Reading position.
- Zoom and page layout.
- Audio/video playback position.
- Reading theme and typography preferences.

When reopening the app or a book, restore the user's relevant state.

### Reliability requirements

- Use safe database transactions.
- Avoid corrupting the library during unexpected shutdowns.
- Ensure asynchronous writes do not silently lose recent edits.
- Handle missing or unreadable assets with useful error messages.
- Keep database metadata and file storage consistent.
- Use an explicit migration strategy for future database schema changes.

A small save indicator may communicate that a change has been persisted, but it should not dominate the interface.

### Scope limitation

Version 1 does not require export, portable book archives, full-library backup, cloud sync, or cross-device synchronization.

Keep the architecture extensible enough that these features could be added later, but do not implement them in the first release.

## 20. Visual identity and design system

### Brand

Name: Tome.

Brand personality: modern, understated, refined, calm, and premium.

Use a clean sans-serif wordmark. Avoid elaborate illustrations, decorative book icons, or excessive branding inside the application.

### Design direction

Use an Apple-inspired minimal interface without copying Apple's proprietary assets or exact interface designs.

Suggested design principles:

- White and soft-gray surfaces.
- Near-black primary text.
- Subtle dividers.
- Restrained accent colors.
- Generous spacing.
- Clear typographic hierarchy.
- Consistent corner radii.
- Soft, purposeful shadows.
- Smooth, brief animations.
- Accessible text contrast.
- Keyboard accessibility.
- Clear focus indicators.

Typography should distinguish between the app interface and reading content. A refined interface sans-serif can be paired with a carefully chosen reading typeface.

### Interaction design

- Prefer contextual controls over permanent toolbars.
- Use clear labels and familiar icons.
- Make destructive actions explicit.
- Avoid unnecessary confirmation dialogs for reversible operations.
- Respect reduced-motion preferences.
- Ensure the interface remains usable on smaller windows.

Do not let the aesthetic direction compromise usability or performance.

## 21. Local storage and privacy

All data must remain local.

Use an appropriate operating-system application-data directory for the database, managed assets, covers, and other internal files.

The implementation must:

- Never upload user content.
- Never make network requests as part of core functionality.
- Avoid remote fonts, CDN dependencies, remote scripts, and external media services at runtime.
- Bundle required application resources locally.
- Keep application permissions minimal.
- Restrict desktop IPC and filesystem access appropriately.
- Sanitize user-controlled paths and filenames.
- Avoid exposing arbitrary filesystem access to untrusted frontend content.
- Handle temporary files and failed imports safely.

Network access may be used during development to install dependencies and obtain libraries. The released app's core operation must not depend on network connectivity.

Provide a documented local data location and an appropriate method for users to understand how much space the library occupies.

## 22. Performance requirements

Tome must remain responsive while managing a personal library containing many books and potentially large media files.

Optimize for:

- Lazy rendering of document pages.
- Efficient image decoding and caching.
- Incremental thumbnail generation.
- Virtualized lists where appropriate.
- Background file copying and processing.
- Avoiding repeated full-document rendering.
- Efficient page-flip animations.
- Reasonable memory usage.
- Safe playback of large local media.
- Responsive editor interactions.

Do not load every page, image, and video into memory simultaneously.

Test large documents and collections instead of evaluating performance only with tiny demo files.

## 23. Error handling

Provide clear, recoverable error states for:

- Unsupported file formats.
- Corrupted documents.
- Missing assets.
- Insufficient disk space.
- Failed imports.
- Failed or interrupted writes.
- Unsupported media codecs.
- PDF editing failures.
- Unexpected application errors.

Error messages should explain what happened and offer a useful next action.

Never silently discard user content or overwrite original files.

## 24. Explicit non-goals for version 1

Do not implement the following unless required for a core feature:

- User accounts.
- Cloud storage or sync.
- Web hosting.
- AI features.
- Online collaboration.
- Social sharing.
- Online marketplaces.
- In-app purchases.
- Subscription management.
- Telemetry or analytics.
- Arbitrary editing of existing PDF text.
- Full Word-style DOCX editing.
- Mandatory online activation.
- Cloud backup or export features.

Keep the product focused on personal, local, offline book creation and reading.

## 25. Testing strategy

Create a practical test plan covering:

### Library tests

- Create, rename, and delete books.
- Upload and replace covers.
- Create collections and tags.
- Search and sort books.
- Switch between grid and bookshelf views.

### Import tests

- Import every supported format.
- Verify that source files remain unchanged.
- Verify that imported content remains accessible after moving the source file.
- Handle duplicate filenames.
- Test large files and interrupted imports.

### Document tests

- Render multi-page PDFs.
- Reorder, delete, rotate, and insert PDF pages.
- Persist highlights, drawings, and notes.
- Render EPUB chapter structures.
- Render DOCX headings, lists, tables, images, and page breaks.

### Mixed-media tests

- Create a book containing PDF, images, audio, video, and text.
- Reorder content.
- Create a custom page with multiple blocks.
- Verify playback controls.
- Verify that embedded controls do not accidentally trigger page turns.

### Persistence tests

- Close and reopen the app.
- Restore reading position and zoom.
- Restore media playback position.
- Verify annotation persistence.
- Simulate unexpected closure during imports or writes.

### Platform tests

- Build and test on Windows.
- Build and test on macOS.
- Verify release packaging.
- Verify offline functionality after installation.
- Test keyboard navigation and reduced-motion behavior.

Automate tests where practical, and maintain a clear list of manual checks for document-rendering and animation behavior.

## 26. Development workflow

Follow this process.

### Phase 1: Feasibility and architecture

Before implementing features:

1. Inspect the available repository and development environment.
2. Determine the current project state.
3. Validate the candidate desktop stack.
4. Investigate PDF, EPUB, DOCX, and media-rendering libraries.
5. Verify page-flip library compatibility.
6. Assess whether the 3D bookshelf can be implemented efficiently.
7. Identify licensing and distribution concerns.
8. Produce a short architecture decision record.
9. Define implementation milestones and acceptance criteria.

If an important requirement cannot be achieved reliably with the proposed stack, explain the limitation and recommend a practical alternative.

### Phase 2: Working application foundation

Implement:

- Desktop application shell.
- Application navigation.
- Design system.
- Local database.
- Managed asset storage.
- Auto-save infrastructure.
- Basic book and collection models.

Create a runnable application early.

### Phase 3: Library and import pipeline

Implement:

- Book creation.
- Title and cover customization.
- Grid library.
- 3D bookshelf.
- Collections and tags.
- Search and sorting.
- Copy-on-import pipeline.
- Persistent local asset management.

### Phase 4: Reading and document rendering

Implement and test:

- PDF reading.
- EPUB rendering.
- DOCX rendering.
- Image viewing.
- Audio playback.
- Video playback.
- TXT and Markdown rendering.
- Reading position persistence.
- Realistic page-flip interactions where appropriate.

### Phase 5: Editors

Implement:

- Read/Edit mode separation.
- Content list editor.
- Reordering of content items.
- Block-based custom-page editor.
- PDF thumbnail editor.
- PDF page operations.
- PDF annotations.
- Auto-save integration.

### Phase 6: Polish and packaging

Implement:

- Welcome letter.
- Removable sample book.
- Empty states.
- Error handling.
- Performance optimizations.
- Keyboard navigation.
- Accessibility refinements.
- Windows packaging.
- macOS packaging.
- GitHub release documentation.

The phases may overlap where that reduces integration risk, but keep each milestone testable.

## 27. Milestone acceptance criteria

Each milestone should have explicit acceptance criteria and a working application state.

A milestone is not complete merely because:

- A screen exists.
- A button is visible.
- A mock document is rendered.
- A placeholder player appears.
- A feature is described in documentation.

A feature is complete only when its underlying behavior works, its data persists as expected, and its relevant tests pass.

If a feature is blocked by a dependency, document the blocker and the alternatives instead of substituting a fake implementation.

## 28. GitHub repository expectations

Produce a clean, maintainable repository with a structure appropriate to the selected stack.

Include:

- A clear README.
- Development setup instructions.
- Build instructions for Windows and macOS.
- Architecture documentation.
- Dependency and licensing notes.
- A practical `.gitignore`.
- Tests and test instructions.
- Release and packaging instructions.
- Troubleshooting guidance.

Keep generated builds and temporary artifacts out of source control unless there is a specific reason to include them.

Do not commit private credentials, unnecessary user data, or local machine-specific configuration.

Use meaningful commits if repository access and permissions allow it.

## 29. How to work with the developer

The developer wants a complete, polished product but prefers clear, manageable steps.

Therefore:

- Explain important decisions briefly and clearly.
- Do not bury the developer in jargon.
- Avoid unnecessary clarification questions when reasonable defaults are available.
- Do not ask for approval after every small implementation step.
- Make progress independently within the agreed scope.
- Flag decisions that would materially change the product or create significant risk.
- Be honest about incomplete features and technical limitations.
- Do not claim a build or test succeeded unless it actually did.
- When blocked, explain the blocker and offer the simplest viable next step.

Prioritize building a coherent product over creating a large number of disconnected features.

## 30. Immediate next action

Start by inspecting the repository and development environment.

Then provide a concise feasibility assessment containing:

1. The recommended architecture and why.
2. The libraries proposed for PDF, EPUB, DOCX, media playback, and page flipping.
3. How the 3D bookshelf and mixed-media page editor will work.
4. The main compatibility and performance risks.
5. The implementation milestones.
6. Any unavoidable trade-offs.

After this assessment, begin implementing the first milestone without waiting for another approval request.

The end goal is a working, locally installed, offline-first Tome application for Windows and macOS that turns a user's files into a beautiful personal multimedia library and book-reading environment.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/54e501f1-3c86-5083-9064-40e44cf6bef4).

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
