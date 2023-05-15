import { useMediaQuery } from "@mui/material";

export const rspWidth = (nonMobile, mobile, galaxyfold) => {
    const isNonMobile = useMediaQuery("(min-width:600px)");
    const isGalaxyFold = useMediaQuery("(max-width:280px)");
    if (isGalaxyFold) return galaxyfold;
    if (!isNonMobile) return mobile;
    if (isNonMobile) return nonMobile;
}