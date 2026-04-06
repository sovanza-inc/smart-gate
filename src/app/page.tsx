"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { createDemoWorkers } from "@/lib/demo-data";
import Navbar from "@/components/Navbar";
import ContractorPage from "@/components/ContractorPage";
import SecurityPage from "@/components/SecurityPage";
import StatsPage from "@/components/StatsPage";

export default function Home() {
  const { workers, setWorkers } = useStore();
  const [activeTab, setActiveTab] = useState("contractor");

  function handleDemo() {
    const newWorkers = createDemoWorkers(workers);
    if (newWorkers.length > 0) {
      setWorkers((prev) => [...prev, ...newWorkers]);
      alert(`${newWorkers.length} demo workers loaded! Go to Security tab to test.`);
    } else {
      alert("Demo workers already loaded.");
    }
  }

  return (
    <>
      <Navbar activeTab={activeTab} onTabChange={setActiveTab} onDemo={handleDemo} />
      {activeTab === "contractor" && <ContractorPage />}
      {activeTab === "security" && <SecurityPage />}
      {activeTab === "stats" && <StatsPage />}
    </>
  );
}
