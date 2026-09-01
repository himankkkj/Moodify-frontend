import vinyl900 from "../../../assets/images/vinyl/vinyl-900.webp";
import vinyl700 from "../../../assets/images/vinyl/vinyl-700.webp";
import vinyl500 from "../../../assets/images/vinyl/vinyl-500.webp";
import "../styles/vinyl.scss";

const VinylRecord = ({ spinning = true, size = 850 }) => {
  return (
    <div
      className={`vinyl ${spinning ? "vinyl--spinning" : ""}`}
      style={{
        width: "100%",
        maxWidth: `${size}px`,
        aspectRatio: "1 / 1",
        margin: "0 auto",
      }}
    >
      <picture>
        {/* Mobile: use bundled optimized 500 (safe, always exists) */}
        <source
          srcSet={vinyl500}
          media="(max-width: 768px)"
          type="image/webp"
        />
        {/* Tablet */}
        <source
          srcSet={vinyl700}
          media="(max-width: 1200px)"
          type="image/webp"
        />
        {/* Desktop */}
        <img
          src={vinyl900}
          srcSet={`${vinyl500} 500w, ${vinyl700} 700w, ${vinyl900} 900w`}
          sizes="(max-width: 768px) 72vw, (max-width: 1200px) 700px, 850px"
          width={size}
          height={size}
          alt="vinyl record"
          fetchPriority="high"
          decoding="async"
          draggable={false}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            display: "block",
          }}
        />
      </picture>
    </div>
  );
};

export default VinylRecord;
