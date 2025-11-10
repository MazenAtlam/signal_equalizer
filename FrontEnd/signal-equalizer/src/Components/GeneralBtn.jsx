import "../../styles/GeneralBtn.css";
import { useState } from "react";

export default function GeneralBtn({ icon, text }) {
  const [clicked, setClicked] = useState(false);
  const [hovered, setHovered] = useState(false);

  return (
    <button
      className={`btn ${
        hovered ? `green-style` : clicked ? `blue-style` : `normal-style`
      }`}
      onClick={() => setClicked(!clicked)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {icon} {text}
    </button>
  );
}
