// src/components/ui/fab.tsx

import { useState } from "react";
import { SpeedDial, SpeedDialAction, SpeedDialIcon } from "@mui/material";
import { useTheme } from "next-themes";

interface FapButtonProps {
  actions: { label: string; icon: React.ReactNode; onClick: () => void }[];
}

const FapButton = ({ actions }: FapButtonProps) => {
  const [open, setOpen] = useState(false);
  return (
    <SpeedDial
      ariaLabel="FAB Actions"
      sx={{
        position: "fixed",
        bottom: 16,
        right: 16,
        "& .MuiFab-root": {
          backgroundColor: "var(--primary)",
          color: "var(--primary-foreground)",
          "&:hover": {
            backgroundColor: "var(--primary-hover)"
          },
        },
      }}
      icon={<SpeedDialIcon />} // Default FAB icon
      onOpen={() => setOpen(true)}
      onClose={() => setOpen(false)}
      open={open}
    >
      {actions.map((action, index) => (
        <SpeedDialAction
          key={index}
          icon={action.icon}
          tooltipTitle={action.label}
          onClick={action.onClick}
        />
      ))}
    </SpeedDial>
  );
};

export default FapButton;
