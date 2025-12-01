import React, { useState } from "react";
import GenericMode from "./Components/GenericMode";
import CustomizedMode from "./Components/CustomizedMode";
import Navbar from "./Components/Navbar";
import "../styles/index.css";
import "../styles/components.css";
import {ToastProvider} from "./Components/Toast.jsx";

const App = () => {
    const [currentMode, setCurrentMode] = useState("generic");
    const [selectedCategory, setSelectedCategory] = useState("Human Voices");

    const handleModeChange = (mode) => {
        setCurrentMode(mode);
    };

    const handleCategoryChange = (category) => {
        setSelectedCategory(category);
    };

    return (
        <ToastProvider>
            <div className="signal-equalizer-app">
                <Navbar
                    currentMode={currentMode}
                    onModeChange={handleModeChange}
                    selectedCategory={selectedCategory}
                    onCategoryChange={handleCategoryChange}
                />
                {currentMode === "generic" ? (
                    <GenericMode />
                ) : (
                    <CustomizedMode selectedCategory={selectedCategory} />
                )}
            </div>
        </ToastProvider>
    );
};

export default App;