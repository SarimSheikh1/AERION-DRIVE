type RecordValue = Record<string, unknown>;
type Props = {
  collection: string;
  value: RecordValue;
  editing: boolean;
  busy: boolean;
  onChange: (value: RecordValue) => void;
  onSave: () => void;
  onCancel: () => void;
};

export default function AdminRecordEditor({
  collection,
  value,
  editing,
  busy,
  onChange,
  onSave,
  onCancel,
}: Props) {
  const change = (key: string, next: unknown) =>
    onChange({ ...value, [key]: next });
  const field = (
    key: string,
    label: string,
    numeric = false,
    disabled = false,
  ) => (
    <label className="field" key={key}>
      <span>{label}</span>
      <input
        required
        type={numeric ? "number" : "text"}
        step={numeric ? "any" : undefined}
        min={numeric ? 0 : undefined}
        disabled={disabled}
        value={String(value[key] ?? "")}
        onChange={(event) =>
          change(key, numeric ? Number(event.target.value) : event.target.value)
        }
      />
    </label>
  );
  const list = (key: string): RecordValue[] =>
    (value[key] as RecordValue[]) || [];
  const updateItem = (key: string, index: number, patch: RecordValue) =>
    change(
      key,
      list(key).map((item, position) =>
        position === index ? { ...item, ...patch } : item,
      ),
    );
  const removeItem = (key: string, index: number) =>
    change(
      key,
      list(key).filter((_, position) => position !== index),
    );
  const mediaFields = (
    item: RecordValue,
    update: (patch: RecordValue) => void,
    prefix = "",
  ) => (
    <>
      {[
        ["url", "Image URL"],
        ["alt", "Image description"],
        ["category", "Image category"],
      ].map(([key, label]) => (
        <label className="field" key={key}>
          <span>
            {prefix}
            {label}
          </span>
          <input
            required
            value={String(item[key] ?? "")}
            onChange={(event) => update({ [key]: event.target.value })}
          />
        </label>
      ))}
    </>
  );
  return (
    <form
      className="panel admin-editor"
      onSubmit={(event) => {
        event.preventDefault();
        onSave();
      }}
    >
      <h2>
        {editing ? "Edit" : "Create"}{" "}
        {collection === "vehicles" ? "vehicle" : "gallery image"}
      </h2>
      {collection === "vehicles" ? (
        <>
          <div className="form-grid">
            {field("name", "Vehicle name")}
            {field("id", "Vehicle ID", false, editing)}
            {field("slug", "URL slug", false, editing)}
            {field("category", "Category")}
            {field("tagline", "Tagline")}
            {field("drivetrain", "Drivetrain")}
            {[
              ["price", "Price (USD)"],
              ["range", "Range (km)"],
              ["topSpeed", "Top speed (km/h)"],
              ["acceleration", "0–100 km/h (seconds)"],
              ["power", "Power (hp)"],
              ["battery", "Battery (kWh)"],
              ["seats", "Seats"],
            ].map(([key, label]) => field(key, label, true))}
          </div>
          <label className="field">
            <span>Description</span>
            <textarea
              required
              rows={4}
              value={String(value.description ?? "")}
              onChange={(event) => change("description", event.target.value)}
            />
          </label>
          <div className="config-actions">
            {["published", "featured"].map((key) => (
              <label key={key}>
                <input
                  type="checkbox"
                  checked={Boolean(value[key])}
                  onChange={(event) => change(key, event.target.checked)}
                />{" "}
                {key === "published" ? "Published" : "Featured"}
              </label>
            ))}
          </div>
          <fieldset>
            <legend>Paint options</legend>
            {list("colors").map((item, index) => (
              <div className="config-actions" key={index}>
                <label className="field">
                  <span>Paint {index + 1} name</span>
                  <input
                    required
                    value={String(item.name)}
                    onChange={(event) =>
                      updateItem("colors", index, { name: event.target.value })
                    }
                  />
                </label>
                <label className="field">
                  <span>Paint {index + 1} colour</span>
                  <input
                    type="color"
                    value={String(item.hex)}
                    onChange={(event) =>
                      updateItem("colors", index, { hex: event.target.value })
                    }
                  />
                </label>
                <button
                  type="button"
                  className="button-outline"
                  disabled={list("colors").length <= 1}
                  onClick={() => removeItem("colors", index)}
                >
                  Remove paint {index + 1}
                </button>
              </div>
            ))}
            <button
              type="button"
              className="button-outline"
              disabled={list("colors").length >= 12}
              onClick={() =>
                change("colors", [
                  ...list("colors"),
                  { name: "New paint", hex: "#888888" },
                ])
              }
            >
              Add paint
            </button>
          </fieldset>
          <fieldset>
            <legend>Wheel options</legend>
            {list("wheels").map((item, index) => (
              <div className="form-grid" key={index}>
                <label className="field">
                  <span>Wheel {index + 1} geometry</span>
                  <select
                    value={String(item.id)}
                    onChange={(event) =>
                      updateItem("wheels", index, { id: event.target.value })
                    }
                  >
                    <option value="aero">Aero</option>
                    <option value="sport">Sport</option>
                  </select>
                </label>
                <label className="field">
                  <span>Wheel {index + 1} name</span>
                  <input
                    required
                    value={String(item.name)}
                    onChange={(event) =>
                      updateItem("wheels", index, { name: event.target.value })
                    }
                  />
                </label>
              </div>
            ))}
          </fieldset>
          <fieldset>
            <legend>Vehicle images</legend>
            {list("media").map((item, index) => (
              <div className="panel" key={index}>
                {mediaFields(
                  item,
                  (patch) => updateItem("media", index, patch),
                  `Image ${index + 1}: `,
                )}
                <button
                  type="button"
                  className="button-outline"
                  onClick={() => removeItem("media", index)}
                >
                  Remove image {index + 1}
                </button>
              </div>
            ))}
            <button
              type="button"
              className="button-outline"
              disabled={list("media").length >= 20}
              onClick={() =>
                change("media", [
                  ...list("media"),
                  {
                    url: "/images/a1.webp",
                    alt: "Vehicle concept",
                    category: "Studio",
                  },
                ])
              }
            >
              Add vehicle image
            </button>
          </fieldset>
        </>
      ) : (
        mediaFields(value, (patch) => onChange({ ...value, ...patch }))
      )}
      <div className="config-actions">
        <button className="button" disabled={busy}>
          {busy ? "Saving…" : "Save changes"}
        </button>
        <button
          type="button"
          className="button-outline"
          disabled={busy}
          onClick={onCancel}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
