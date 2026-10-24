export function WelcomeLetter({ onClose }: { onClose: () => void }) {
  return (
    <div className="tome-overlay">
      <article className="tome-letter tome-reading">
        <p className="tome-letter-kicker">Tome</p>
        <h2 className="text-3xl">Welcome.</h2>
        <p>Tome binds your files together into books — documents, pictures, recordings, and notes, in whatever order you choose.</p>
        <p><strong>To begin</strong>, press <em>New book</em>, give it a title, and, if you like, a cover image. Without one, Tome sets a quiet cover for you.</p>
        <p>Soon you'll import files into each book, rearrange them, and switch between <em>Read</em> and <em>Edit</em>. Imported files are copied — your originals are never touched.</p>
        <p>Everything lives on this computer. No accounts, no cloud, no tracking.</p>
        <button className="tome-btn tome-btn-primary mt-4 font-sans" onClick={onClose}>Open my library</button>
      </article>
    </div>
  );
}
