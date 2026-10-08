import React, { useState } from 'react';
import { CameraMode, DepartmentId } from './types/office';
import { Office3D } from './components/Office3D';
import { HeaderHUD } from './components/HeaderHUD';
import { BottomHUD } from './components/BottomHUD';
import { DealDeskModal } from './components/DealDeskModal';
import { officeAudio } from './utils/audio';

export default function App() {
  const [cameraMode, setCameraMode] = useState<CameraMode>('isometric');
  const [activeDepartment, setActiveDepartment] = useState<DepartmentId | null>('acquisitions');
  const [isDealDeskOpen, setIsDealDeskOpen] = useState<boolean>(false);
  const [dealDeskDept, setDealDeskDept] = useState<DepartmentId>('acquisitions');
  const [brightness, setBrightness] = useState<number>(1.15);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(false);

  const handleSelectDepartment = (dept: DepartmentId) => {
    setActiveDepartment(dept);
    setCameraMode(dept);
  };

  const handleOpenDealDesk = (dept: DepartmentId) => {
    setDealDeskDept(dept);
    setActiveDepartment(dept);
    setIsDealDeskOpen(true);
  };

  const handleToggleSound = () => {
    if (soundEnabled) {
      officeAudio.stop();
      setSoundEnabled(false);
    } else {
      officeAudio.start();
      setSoundEnabled(true);
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 font-sans text-slate-100 select-none">
      {/* Top HUD with Branding, Camera Toggles, Lighting Slider, Audio */}
      <HeaderHUD
        cameraMode={cameraMode}
        onSetCameraMode={(mode) => {
          setCameraMode(mode);
          if (
            mode === 'acquisitions' ||
            mode === 'dispositions' ||
            mode === 'operations' ||
            mode === 'ceo' ||
            mode === 'deal-review'
          ) {
            setActiveDepartment(mode);
          }
        }}
        onOpenDealDesk={handleOpenDealDesk}
        activeDepartment={activeDepartment}
        brightness={brightness}
        onSetBrightness={setBrightness}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
      />

      {/* Main 3D Virtual Headquarters Office Simulation */}
      <main className="w-full h-full">
        <Office3D
          cameraMode={cameraMode}
          onSelectDepartment={handleSelectDepartment}
          onOpenDealDesk={handleOpenDealDesk}
          activeDepartment={activeDepartment}
          brightness={brightness}
        />
      </main>

      {/* Bottom Dock with Department Cards and Real-Time Stream */}
      <BottomHUD
        activeDepartment={activeDepartment}
        onSelectDepartment={handleSelectDepartment}
        onOpenDealDesk={handleOpenDealDesk}
      />

      {/* Full DealDesk Ultra Workstation Inspection Modal */}
      {isDealDeskOpen && (
        <DealDeskModal
          initialDepartment={dealDeskDept}
          onClose={() => setIsDealDeskOpen(false)}
          onSelectDepartmentIn3D={(dept) => {
            handleSelectDepartment(dept);
          }}
        />
      )}
    </div>
  );
}
