import type { InputHTMLAttributes } from "react";

export function SmartInput({
  id,
  options,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { id: string; options: string[] }) {
  const listId = `${id}-options`;
  return (
    <>
      <input id={id} list={listId} {...props} />
      <datalist id={listId}>
        {options.map((option) => (
          <option value={option} key={option} />
        ))}
      </datalist>
    </>
  );
}
