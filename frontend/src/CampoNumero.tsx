import { type InputHTMLAttributes, useEffect, useState } from "react";

interface Props extends Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "type"> {
  value: number;
  onChange: (valor: number) => void;
}

/**
 * Campo numérico que no muestra el 0 inicial: se ve vacío con un 0 de referencia en gris,
 * así se escribe directamente sin borrar nada.
 */
export default function CampoNumero({ value, onChange, ...resto }: Props) {
  const [texto, setTexto] = useState(value === 0 ? "" : String(value));

  // Si el valor cambia desde fuera (por ejemplo, al cargar un pedido), se actualiza el texto.
  useEffect(() => {
    setTexto((actual) => {
      if (actual !== "" && Number(actual) === value) return actual;
      return value === 0 ? "" : String(value);
    });
  }, [value]);

  return (
    <input
      {...resto}
      type="number"
      inputMode="decimal"
      placeholder="0"
      value={texto}
      onChange={(e) => {
        const nuevo = e.target.value;
        setTexto(nuevo);
        onChange(nuevo === "" ? 0 : Number(nuevo));
      }}
    />
  );
}
