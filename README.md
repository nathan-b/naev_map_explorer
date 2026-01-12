# Naev Map Explorer

This project is a simple map explorer for the space exploration game Naev. It uses the game's actual data and so is always up-to-date.

Please note that this project is unaffiliated with the Naev open-source game, other than the developer (i.e. me) thinking it's pretty neat and you should probably play it. Though you likely already do and that's why you're here.

## Installing

### Download

Download the latest release for your platform from the [Releases page](https://github.com/nathan-b/naev_map_explorer/releases/latest). Make sure you download the image for the correct platform and architecture.

#### Determining Your Architecture

**Linux**

```bash
uname -m
# x86_64 or amd64 → Download x64 version
# aarch64 or arm64 → Download arm64 version
```

**Windows**

Check: Settings → System → About → System type

- **Most PCs:** x64 (Intel/AMD processors)
- **ARM Windows:** arm64 (Microsoft Surface Pro X, ARM-based laptops)

**macOS**

Check: Apple menu → About This Mac → Chip

- **Intel Macs** (2020 and earlier): x64
- **Apple Silicon** (M1/M2/M3, 2020+): arm64

### Install

Install the application using the image you downloaded in the step above. Note that some images (such as the Windows standalone package or the Linux AppImage) do not require much installation, just put it somewhere reasonable.

### Run

Note that on Linux you will need to make the AppImage executable using

```bash
chmod +x Naev.Map.Explorer-*.AppImage
```

## Using

When you run the program, you are presented with a blank screen and a few options on the bottom for loading map data.

### Loading map data

When you run the program it will attempt to find a local Naev installation. You can also browse your local directories to select an installation root.

If you do not have a local installation or you want to look at the most up-to-date map, the project can also pull the map data from GitHub.

### Navigating the map

You can move the map around by clicking and dragging. You can zoom in and out with the mouse wheel.

Clicking on a system will bring up a minimap showing all the points of interest in that system. You can close the minimap by clicking the X in the top right corner of the minimap.

Systems (and landing sites in the minimap) are drawn according to the following legend:
 - No fill: No services
 - Yellow fill: Refueling only
 - Orange fill: Outfitter
 - Green fill: Shipyard

 Landing sites drawn with a red circle are restricted -- usually this means you need a certain high reputation with the faction before you can land there.

 Jumps are drawn in blue for normal jumps and red for hidden jumps. You generally cannot discover a hidden jump without purchasing a map that has them on it.

### Searching the map

After loading data, the command palette at the bottom of the window reconfigures to display a search interface. You can search (case-insenstitive) for a system or an object inside the system and the results will highlight in the map. For example, if you are looking for the Soromid planet Jasmine, you could type "jasmine" or "jas" and you would see the Gewirn system highlighted.

## Development

The project is implemented as an electron app. JavaScript, HTML, and UI design in general are all not my primary skill set, so I'm happy to take patches from people more skilled in this area than I am.

### Running the tests

```
npm test
```

### Code organization

The app follows the standard Electron approach of UI run in the browser sandbox, core logic run outside in node.js, and an IPC bridge between the two.

* `index.js`: IPC bridge definition and window creation. Main entrypoint.
* `preload.js`: Sets up the IPC bridge on the node.js side.
* `render.js`: Main UI logic, runs in sandbox.
* `canvas.js`: Drawing helpers and a JavaScript HTML canvas wrapper. Runs in the sandbox.
* `github.js`: Helper function for interacting with the GitHub API.
* `naev.js`: Handles loading and parsing of game data.

## Releasing

I had AI build me a release system. Hopefully it works. I don't know anything about this stuff. See RELEASE.md (written by AI as well) for release information.

## Troubleshooting

### Linux: AppImage won't run
```bash
# Make sure it's executable
chmod +x Naev.Map.Explorer-*.AppImage

# If you get FUSE errors, extract and run:
./Naev.Map.Explorer-*.AppImage --appimage-extract
./squashfs-root/AppRun
```

### Windows: "Windows protected your PC" warning

This is normal for unsigned applications. Click "More info" → "Run anyway". The app is safe but lacks a code signing certificate (~$400/year).

### macOS: "Cannot open because it's from an unidentified developer"

Right-click the app → Open (don't double-click the first time). This bypasses Gatekeeper for unsigned apps. I'm also not paying for code signing on macOS.
