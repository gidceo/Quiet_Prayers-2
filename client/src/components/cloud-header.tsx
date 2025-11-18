import cloudImage from "@assets/generated_images/Peaceful_dawn_clouds_header_9e9fef52.png";
import { Link } from "wouter";
import { Bookmark } from "lucide-react";
import { Button } from "./ui/button";

export function CloudHeader() {
  return (
    <div className="relative h-[40vh] md:h-[40vh] w-full overflow-hidden">
      <img
        src={cloudImage}
        alt="Peaceful clouds"
        className="absolute inset-0 w-full h-full object-cover"
      />
      
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-transparent" />
      
      <div className="relative h-full flex flex-col items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-3 drop-shadow-lg">
            QuietPrayers
          </h1>
          <p className="text-lg md:text-xl text-white/90 drop-shadow-md">
            A sacred space for prayer and reflection
          </p>
        </div>

        <div className="absolute top-4 right-4 flex flex-wrap gap-2 justify-end">
          <Link href="/">
            <Button
              variant="outline"
              className="bg-background/20 backdrop-blur-md border-white/30 text-white hover:bg-background/30"
            >
              Prayer Requests
            </Button>
          </Link>

          <Link href="/q-and-a">
            <Button
              variant="outline"
              className="bg-background/20 backdrop-blur-md border-white/30 text-white hover:bg-background/30"
            >
              Q&A
            </Button>
          </Link>

          <Link href="/bookmarks">
            <Button
              variant="outline"
              className="bg-background/20 backdrop-blur-md border-white/30 text-white hover:bg-background/30"
              data-testid="button-view-bookmarks"
            >
              <Bookmark className="h-4 w-4 mr-2" />
              Saved
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
