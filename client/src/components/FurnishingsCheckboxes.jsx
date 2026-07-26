export const OPTIONS = [
  { value: "arredato", label: "Arredato" },
  { value: "lavatrice", label: "Lavatrice" },
  { value: "aria_condizionata", label: "Aria condizionata" },
  { value: "ascensore", label: "Ascensore" },
  { value: "box_auto", label: "Box auto" },
  { value: "terrazzo", label: "Terrazzo" },
];

function FurnishingsCheckboxes({ value = [], onChange }) {
  function toggle(option) {
    if (value.includes(option)) {
      onChange(value.filter((v) => v !== option));
    } else {
      onChange([...value, option]);
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <span className="text-sm font-medium text-gray-700">Dotazioni</span>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {OPTIONS.map((option) => (
          <label key={option.value} className="flex items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={value.includes(option.value)}
              onChange={() => toggle(option.value)}
              className="rounded border-gray-300 text-primary-700 focus:ring-primary-500"
            />
            {option.label}
          </label>
        ))}
      </div>
    </div>
  );
}

export default FurnishingsCheckboxes;
