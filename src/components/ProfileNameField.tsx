import { useEffect, useState } from "react";
import { validProfileName } from "../services/profiles";

export function ProfileNameField({ id, name, onSave }: {
  id: string; name: string; onSave: (name: string) => void
}) {
  const [draft, setDraft] = useState(name);
  useEffect(() => { setDraft(name); }, [id, name]);
  const valid = validProfileName(draft);
  return <label className="input-label">
    Profile name
    <input type="text" maxLength={80} value={draft} aria-invalid={!valid}
      aria-describedby="profile-name-hint"
      onChange={event => setDraft(event.target.value)}
      onKeyDown={event => { if (event.key === "Enter") event.currentTarget.blur(); }}
      onBlur={() => {
        if (valid) onSave(draft.trim());
        else setDraft(name);
      }} />
    <span id="profile-name-hint" className="muted subtext">
      {valid ? "Changes are saved when you leave this field." : "Enter a nonempty name of up to 80 UTF-8 bytes."}
    </span>
  </label>;
}
