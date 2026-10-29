# Pepsi

An example 2D multiplayer cat simulator project with spirtes from [Mattz Art](https://xzany.itch.io/cat-2d-pixel-art).

## Prerequisites

- **CMake** 3.16 or newer
- **A C++20 compiler** — Clang 14+, GCC 11+, MSVC 19.30+
- **Node.js** with `npx` available, for transpiling TypeScript scripts to JS
- **Git** — for the `FetchContent` clone of the engine on first configure
- **Python 3** with `jinja2` (`pip3 install --user jinja2`) — used by the
  engine's bundled OpenGL loader generator during its build

## Getting started

The first build bootstraps the whole toolchain — it clones the engine, builds
it, builds `bokken-cli`, then compiles and packs your game:

```bash
make build
```

Then install the CLI so you can use it from anywhere:

```bash
make install
```

On macOS and Linux this copies `bokken-cli` to `~/.local/bin` (no `sudo`). If
that directory isn't on your `PATH` yet, the command prints the line to add to
your shell profile (`~/.zshrc` or `~/.bashrc`):

```bash
export PATH="$HOME/.local/bin:$PATH"
```

On Windows it installs to `%LOCALAPPDATA%\Programs\bokken` and prints a `setx`
command to add that to your `PATH`. Open a new terminal afterward.

From there, `make` is optional — everything runs through the CLI.

## Using bokken-cli

`bokken-cli help` lists every command; `bokken-cli <command> --help` shows the
detail for one. The everyday loop:

```bash
bokken-cli run            # build, then launch the game
bokken-cli watch --run    # rebuild and hot-reload on file changes
```

The full command surface:

| Command   | What it does                                            |
| --------- | ------------------------------------------------------- |
| `setup`   | Configure the native build (first-time bootstrap)       |
| `build`   | Compile scripts, pack assets, and build the native game |
| `run`     | Build, then launch the game and wait for it             |
| `watch`   | Live-reload: rebuild and hot-swap on file changes       |
| `clean`   | Remove build artifacts and incremental caches           |
| `compile` | Compile transpiled JS to QuickJS bytecode (low-level)   |
| `pack`    | Pack a directory tree into .assetpack archives (low-level) |
| `doctor`  | Check the toolchain and project health                  |

`compile` and `pack` are pipeline steps that `build` runs for you; they're
exposed for tooling and debugging. Useful flags: `run` and `build` take
`--force` (ignore incremental caches) and `--project <dir>`; `run` also takes
`--no-build` to launch what's already deployed; `watch` takes `--run`,
`--no-assets`, and `--port <n>`.

## Make targets

`make` remains the bootstrap entry point and a thin wrapper over the CLI, so
the two stay in sync:

```bash
make build       # full build (and the first-time engine + CLI bootstrap)
make run         # build, then launch (delegates to bokken-cli run)
make watch       # live-reload loop (delegates to bokken-cli watch --run)
make setup       # re-run CMake configure without a full rebuild
make typescript  # transpile TypeScript only
make doctor      # check the toolchain
make clean       # remove build artifacts (keeps the FetchContent cache)
make install     # copy bokken-cli onto your PATH
make uninstall   # remove an installed bokken-cli
```

`make clean` does not remove the cached engine source. To force a fresh engine
clone, delete `_deps/` inside the build directory.

## Pinning the engine version

The build defaults to tracking the engine's `master` branch. To pin a specific
git ref (tag, branch, or commit SHA), pass `BOKKEN_ENGINE_TAG`:

```bash
make build BOKKEN_ENGINE_TAG=v1.2.3
```

When invoking CMake directly:

```bash
cmake -S . -B build/<platform> -DSCRIPTS_DIR=... -DBOKKEN_ENGINE_TAG=v1.2.3
```

Tracking `master` is convenient for early development but isn't reproducible —
pin a release tag once your project depends on a stable engine surface.