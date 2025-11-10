import GeneralBtn from "./GeneralBtn";

export default function Navbar() {
  return (
    <div
      className="navContainer pt-4 py-3 d-flex justify-content-between px-5"
      style={{ backgroundColor: "#1A1D23" }}
    >
      <div
        className="logo my-auto d-flex"
        style={{ fontSize: "25px", color: "white", fontWeight: "700" }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#D5A424"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="lucide lucide-chart-column h-6 w-6 text-amber-400"
        >
          <path d="M3 3v16a2 2 0 0 0 2 2h16"></path>
          <path d="M18 17V9"></path>
          <path d="M13 17V5"></path>
          <path d="M8 17v-3"></path>
        </svg>{" "}
        <h1
          className="h3 mx-3 fw-bold pb-1"
          style={{
            background: "linear-gradient(to right, #1FD5F9, #7837baff)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            color: "transparent",
          }}
        >
          Signal Equalizer
        </h1>
      </div>
      <div className="modes mb-2">
        <GeneralBtn text={`Generic Mode`} />
        <GeneralBtn text={`Customized Mode`} />
      </div>
    </div>
  );
}
