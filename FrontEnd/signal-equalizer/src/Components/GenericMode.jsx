// GenericMode.jsx
import React from "react";
import Navbar from "./Navbar";
import SelectViewer from "./SelectViewer";
import UploadCard from "./UploadCard";
import FrequencyGraph from "./FrequencyGraph";
import SpectrogramAnalyzer from "./SpectrogramAnalyzer";
import AudioPlayer from "./AudioPlayer";
import CineViewer from "./CineViewer";
import Footer from "./Footer";
import GenericEqualizer from "./GenericEqualizer";
import "../../styles/index.css";
import "../../styles/components.css";

const GenericMode = () => {
  return (
    <div className="signal-equalizer-app">
      <Navbar />
      <main className="equalizer-main">
        <SelectViewer />
        <UploadCard />
        <FrequencyGraph />
        <SpectrogramAnalyzer />
        <AudioPlayer />
        <CineViewer />
      </main>
      <GenericEqualizer />
      <Footer />
    </div>
  );
};

export default GenericMode;
