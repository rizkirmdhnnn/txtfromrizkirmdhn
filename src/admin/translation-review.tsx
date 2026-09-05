import type { EntryData, Lang, SiteData } from "../lib/cms";
import { setTranslation, translationText } from "./edit-helpers";

export type Translation = { field: string; text: string; target: Lang };

export function TranslationReview({
  draft,
  translation,
  onChangeText,
  onApply,
  onCancel,
}: {
  draft: EntryData | SiteData;
  translation: Translation;
  onChangeText: (text: string) => void;
  onApply: (draft: EntryData | SiteData, target: Lang) => void;
  onCancel: () => void;
}) {
  return (
    <section className="cms-card translation-review">
      <h2>Tinjau terjemahan · {translation.target.toUpperCase()}</h2>
      <textarea
        aria-label="Hasil terjemahan"
        value={translation.text}
        onChange={(ev) => onChangeText(ev.target.value)}
      />
      <div className="cms-actions">
        <button className="cms-button" onClick={onCancel}>
          Batalkan
        </button>
        <button
          className="cms-button strong"
          onClick={() => {
            const current = translationText(
              draft,
              translation.target,
              translation.field,
            );
            if (
              current &&
              !confirm("Ganti teks terjemahan yang sudah ada pada draft?")
            )
              return;
            onApply(
              setTranslation(
                draft,
                translation.target,
                translation.field,
                translation.text,
              ),
              translation.target,
            );
          }}
        >
          Terapkan ke draft
        </button>
      </div>
    </section>
  );
}
