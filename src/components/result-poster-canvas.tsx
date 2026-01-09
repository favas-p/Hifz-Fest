"use client";

interface PrizeEntry {
  position: 1 | 2 | 3;
  studentName?: string;
  teamName?: string;
  chestNumber?: string;
}

interface PosterData {
  programName: string;
  section?: string;

  prizes: PrizeEntry[];
}

export type PosterStyle = 1 | 2 | 3;

// Cache for loaded images to prevent redundant network requests and decoding
const imageCache = new Map<string, HTMLImageElement>();

/**
 * Load image from URL and return as Image element
 * Uses caching to improve performance on repeated calls
 */
function loadImage(url: string): Promise<HTMLImageElement> {
  if (imageCache.has(url)) {
    return Promise.resolve(imageCache.get(url)!);
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      imageCache.set(url, img);
      resolve(img);
    };
    img.onerror = reject;
    img.src = url;
  });
}

/**
 * Get gradient colors for different poster styles
 */
/**
 * Get theme colors for different poster styles
 */
function getPosterTheme(style: PosterStyle) {
  switch (style) {
    case 1:
      // Default purple gradient theme
      return {
        stops: [
          { offset: 0, color: "#1e1b4b" }, // Deep purple
          { offset: 0.3, color: "#312e81" }, // Indigo
          { offset: 0.7, color: "#581c87" }, // Purple
          { offset: 1, color: "#4c1d95" }, // Dark purple
        ],
        textColors: {
          program: "#f05002", // Dark purple
          section: "#000000", // Purple
          name: "#000000", // Deep purple
          team: "#000000", // Violet
        },
      };
    case 2:
      // Blue gradient theme
      return {
        stops: [
          { offset: 0, color: "#0f172a" }, // Slate
          { offset: 0.3, color: "#1e3a8a" }, // Blue
          { offset: 0.7, color: "#3b82f6" }, // Light blue
          { offset: 1, color: "#1e40af" }, // Dark blue
        ],
        textColors: {
          program: "#fffff", // Dark blue
          section: "#f05002", // Blue
          name: "#ffffff", // Slate
          team: "#ffffff", // Darker blue
        },
      };
    case 3:
      // Emerald/Teal gradient theme
      return {
        stops: [
          { offset: 0, color: "#064e3b" }, // Dark emerald
          { offset: 0.3, color: "#065f46" }, // Emerald
          { offset: 0.7, color: "#059669" }, // Light emerald
          { offset: 1, color: "#047857" }, // Dark emerald
        ],
        textColors: {
          program: "#ffffff", // Dark emerald
          section: "#ffffff", // Emerald
          name: "#ffffff", // Very dark emerald
          team: "#ffffff", // Dark emerald
        },
      };
    default:
      return {
        stops: [
          { offset: 0, color: "#1e1b4b" },
          { offset: 0.3, color: "#312e81" },
          { offset: 0.7, color: "#581c87" },
          { offset: 1, color: "#4c1d95" },
        ],
        textColors: {
          program: "#bd6229",
          section: "#6d28d9",
          name: "#1e1b4b",
          team: "#5b21b6",
        },
      };
  }
}

/**
 * Generate a high-quality poster canvas image for the result
 * @param data Poster data
 * @param style Poster style variant (1, 2, or 3)
 * @returns Promise that resolves to Data URL of the generated PNG image
 */
export async function generateResultPoster(data: PosterData, style: PosterStyle = 1): Promise<string> {
  // 1. Load poster template background first to get its dimensions
  const theme = getPosterTheme(style);
  const templateUrl = `/poster-template-${style}.webp`;

  let templateImage: HTMLImageElement | null = null;
  let imageWidth = 1080; // Default fallback width
  let imageHeight = 1350; // Default fallback height

  try {
    templateImage = await loadImage(templateUrl);
    imageWidth = templateImage.width;
    imageHeight = templateImage.height;
  } catch (error) {
    console.warn("Failed to load poster template, using fallback dimensions:", error);
  }

  // Create canvas with exact image dimensions
  const canvas = document.createElement("canvas");
  canvas.width = imageWidth;
  canvas.height = imageHeight;
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Failed to get canvas context");
  }

  // Set high quality rendering
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  // Draw poster template background
  if (templateImage) {
    // Draw the template image at its natural size
    ctx.drawImage(templateImage, 0, 0, imageWidth, imageHeight);
  } else {
    // Fallback to gradient background if image fails to load
    const gradient = ctx.createLinearGradient(0, 0, imageWidth, imageHeight);
    theme.stops.forEach((stop) => {
      gradient.addColorStop(stop.offset, stop.color);
    });
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, imageWidth, imageHeight);
  }

  // Calculate scale factors based on original 1080x1350 dimensions
  const scaleX = imageWidth / 1080;
  const scaleY = imageHeight / 1350;

  // 3. Title Section - Program Name
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // Program Name - scaled font size
  const titleY = 400 * scaleY;
  const fontSize = 74 * scaleY;
  ctx.fillStyle = theme.textColors.program;
  ctx.font = `${fontSize}px 'Charutha', sans-serif`;
  // Truncate long program names if needed
  let displayProgramName = data.programName;
  const maxTitleWidth = 940 * scaleX;
  let metrics = ctx.measureText(displayProgramName);
  if (metrics.width > maxTitleWidth) {
    // Truncate with ellipsis if too long
    while (ctx.measureText(displayProgramName + "...").width > maxTitleWidth && displayProgramName.length > 0) {
      displayProgramName = displayProgramName.slice(0, -1);
    }
    displayProgramName = displayProgramName + "...";
  }
  const leftMargin = 380 * scaleX;
  ctx.fillText(displayProgramName, leftMargin, titleY);

  // 4. Section - smaller than program name, normal style
  const sectionY = 460 * scaleY; // Decreased gap from ProgramName
  ctx.fillStyle = theme.textColors.section;
  const sectionFontSize = 48 * scaleY;
  ctx.font = `${sectionFontSize}px 'Arial', sans-serif`; // Normal style, smaller than program name
  // Truncate long section names if needed
  let displaySection = data.section || "General";
  const maxSectionWidth = 940 * scaleX;
  metrics = ctx.measureText(displaySection);
  if (metrics.width > maxSectionWidth) {
    // Truncate with ellipsis if too long
    while (ctx.measureText(displaySection + "...").width > maxSectionWidth && displaySection.length > 0) {
      displaySection = displaySection.slice(0, -1);
    }
    displaySection = displaySection + "...";
  }
  ctx.fillText(displaySection, leftMargin, sectionY);

  // 5. Prize Sections
  const currentY = 558 * scaleY;
  const prizeSpacing = 120 * scaleY;
  const sectionWidth = 800 * scaleX;
  const sectionX = (imageWidth - sectionWidth) / 2;

  // Sort prizes by position
  const sortedPrizes = [...data.prizes].sort((a, b) => a.position - b.position);

  sortedPrizes.forEach((prize, index) => {
    const positionY = currentY + index * prizeSpacing;

    // Student/Team Name
    const name = prize.studentName || prize.teamName || "—";
    ctx.fillStyle = theme.textColors.name;
    const nameFontSize = 48 * scaleY;
    ctx.font = `bold ${nameFontSize}px 'Arial', sans-serif`;
    ctx.textAlign = "left";

    const nameStartX = sectionX + 40 * scaleX;
    const nameY = positionY + 50 * scaleY;
    const teamNameY = nameY + 50 * scaleY; // Team name Y position

    // Truncate long names to fit
    const maxNameWidth = sectionWidth - 80 * scaleX;
    let displayName = name;
    const metrics = ctx.measureText(displayName);
    if (metrics.width > maxNameWidth) {
      // Truncate with ellipsis
      while (ctx.measureText(displayName + "...").width > maxNameWidth && displayName.length > 0) {
        displayName = displayName.slice(0, -1);
      }
      displayName = displayName + "...";
    }

    // Draw student/team name
    ctx.font = `bold ${nameFontSize}px 'Arial', sans-serif`;
    ctx.fillText(displayName, nameStartX, nameY);

    // Team Name (if student) - smaller font
    if (prize.studentName && prize.teamName) {
      ctx.fillStyle = theme.textColors.team;
      const teamFontSize = 32 * scaleY;
      ctx.font = `${teamFontSize}px 'Arial', sans-serif`;
      ctx.fillText(prize.teamName, nameStartX, teamNameY);
    } else if (!prize.studentName && prize.teamName) {
      // Show team name even when no student (group/general sections)
      ctx.fillStyle = theme.textColors.team;
      const teamFontSize = 32 * scaleY;
      ctx.font = `${teamFontSize}px 'Arial', sans-serif`;
      ctx.fillText(prize.teamName, nameStartX, teamNameY);
    }
  });

  // 6. Footer decoration
  const footerY = 1250 * scaleY;
  ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
  const footerFontSize = 24 * scaleY;
  ctx.font = `${footerFontSize}px 'Arial', sans-serif`;
  ctx.textAlign = "center";
  ctx.fillText("Official Results", imageWidth / 2, footerY + 40 * scaleY);

  // 7. Add shadow effect around the poster
  ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
  ctx.shadowBlur = 40;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 10;

  // Convert to data URL
  return canvas.toDataURL("image/png", 1.0);
}

