APP_NAME = Pepsi

# OS & Paths
ifeq ($(OS),Windows_NT)
    PLATFORM_DIR = windows
    P_SEP = \\
    CLEAN_CMD = rmdir /s /q build 2>nul || exit 0
    EXE_SUFFIX = .exe
    # Per-user, no-admin install location on Windows (the conventional spot
    # for user-installed CLIs, analogous to ~/.local/bin). Override with
    #   make install INSTALL_DIR="C:\tools\bin"
    INSTALL_DIR ?= $(LOCALAPPDATA)\Programs\bokken
else
    PLATFORM_DIR = $(shell uname -s | tr '[:upper:]' '[:lower:]')
    P_SEP = /
    CLEAN_CMD = rm -rf build
    EXE_SUFFIX =
    # Where `make install` puts bokken-cli on Unix. Defaults to a user-local
    # prefix so no sudo is needed; ~/.local/bin is the conventional spot.
    # Override for a system-wide install:
    #   sudo make install PREFIX=/usr/local      # system-wide (needs sudo)
    #   make install PREFIX=/opt/homebrew        # alongside Homebrew on Apple Si
    # DESTDIR supports staged installs / packaging (prepended to PREFIX).
    PREFIX     ?= $(HOME)/.local
    DESTDIR    ?=
    INSTALL_DIR = $(DESTDIR)$(PREFIX)/bin
endif

BUILD_TEMP   = build$(P_SEP)$(PLATFORM_DIR)
SCRIPTS_OUT  = $(BUILD_TEMP)$(P_SEP)transpiled
CMAKE_CACHE  = $(BUILD_TEMP)$(P_SEP)CMakeCache.txt
TS_STAMP     = $(BUILD_TEMP)$(P_SEP).tsc.stamp
BIN          = $(BUILD_TEMP)$(P_SEP)bin$(P_SEP)$(APP_NAME)$(EXE_SUFFIX)
CLI_BIN      = $(BUILD_TEMP)$(P_SEP)bin$(P_SEP)bokken-cli$(EXE_SUFFIX)

# TypeScript inputs — captured at parse time. Adding a brand-new .ts
# file requires a second `make` invocation to register, since `find`
# runs before the new file lands on disk on the first one.
TS_SOURCES = $(shell find src types -type f \( -name '*.ts' -o -name '*.tsx' -o -name '*.d.ts' \) 2>/dev/null) tsconfig.json

# Optional: pin the engine to a specific git ref.
#   make build BOKKEN_ENGINE_TAG=v1.2.3
#
# The very first build clones the engine via CMake's FetchContent. The
# engine builds bokken-cli as a sibling target, and the project's
# CMakeLists picks that target up automatically — so there is nothing to
# install on PATH beforehand. `make build` on a clean tree is enough to
# build the CLI, configure the project to find it, and produce the game.
BOKKEN_ENGINE_TAG ?= master

# Default
all: build

# File-backed targets (incremental)
#
# These exist as actual files on disk. Make compares timestamps and
# skips the recipe when the target is newer than its prerequisites —
# which is what makes a no-op `make run` actually no-op.

# CMake configure runs ONCE, when CMakeCache.txt doesn't exist yet
# (or after `make clean`). Subsequent invocations are skipped because
# Make sees the cache file is present and the dependency is satisfied.
# CMake's own auto-regen handles re-configures when CMakeLists.txt
# itself changes — that happens during `cmake --build`, not here.
#
# The first configure is also where the engine is fetched and bokken-cli
# is built as part of it, so a clean `make build` bootstraps the whole
# toolchain without any prior install step.
#
# IMPORTANT: this target depends ONLY on the existence of $(SCRIPTS_OUT)
# as a directory (order-only prerequisite, after the |), NOT on the tsc
# stamp. The cmake configure step doesn't read transpiled JS — it just
# needs the path to exist. Depending on $(TS_STAMP) here would mean every
# tsc rerun (i.e. every .tsx edit) invalidates the cmake cache and triggers
# a full reconfigure, cascading into rebuilds of the engine and everything
# downstream.
$(CMAKE_CACHE): | $(SCRIPTS_OUT)
	cmake -S . -B $(BUILD_TEMP) -DCMAKE_BUILD_TYPE=Debug \
	    -DSCRIPTS_DIR="$(abspath $(SCRIPTS_OUT))" \
	    -DBOKKEN_ENGINE_TAG="$(BOKKEN_ENGINE_TAG)"

# Order-only prerequisite: the directory has to exist before configure
# runs, but its mtime doesn't propagate up — files landing inside don't
# make $(CMAKE_CACHE) appear stale.
$(SCRIPTS_OUT):
	@mkdir -p $(SCRIPTS_OUT)

# tsc re-runs only when a .ts/.tsx/.d.ts file or tsconfig.json is
# newer than the stamp. The stamp is touched after a successful tsc,
# giving us a single mtime to compare against.
$(TS_STAMP): $(TS_SOURCES) | $(SCRIPTS_OUT)
	@echo "Compiling TypeScript..."
	npx tsc --project tsconfig.json --outDir $(SCRIPTS_OUT)
	@touch $(TS_STAMP)

# Phony entry points
#
# Thin wrappers around the file-backed targets. `build` triggers tsc and
# the cmake configure independently — neither depends on the other through
# the Make graph. cmake --build at the end picks up whatever tsc produced
# via the OUTPUT-driven custom commands inside CMakeLists.txt.
build: $(TS_STAMP) $(CMAKE_CACHE)
	cmake --build $(BUILD_TEMP)
	@echo ""
	@echo "Build complete. Executable & assets deployed to $(BUILD_TEMP)$(P_SEP)bin."
	@echo "Run 'make install' to put bokken-cli on your PATH, then drive"
	@echo "everything with 'bokken-cli run', 'bokken-cli watch --run', etc."

# Force a re-setup. Removes the stamps so the next build re-runs tsc
# and re-runs cmake configure. Useful when CMake state is wedged but
# you don't want to nuke the whole build/ tree (and trigger a full
# engine reclone).
setup:
	@rm -f $(TS_STAMP) $(CMAKE_CACHE)
	@$(MAKE) $(CMAKE_CACHE)

ifeq ($(OS),Windows_NT)

# Build, then launch — delegates to the deployed bokken-cli so `make run`
# and `bokken-cli run` behave identically.
run: build
	@if exist "$(CLI_BIN)" ( "$(CLI_BIN)" run --no-build ) else ( "$(BIN)" )

# Incremental rebuild + live reload via the deployed bokken-cli.
watch: build
	@if exist "$(CLI_BIN)" ( "$(CLI_BIN)" watch --run --bin "$(APP_NAME)" ) \
	else ( bokken-cli watch --run --bin "$(APP_NAME)" )

# Verify the toolchain. Falls back to a message if the CLI isn't built yet.
doctor:
	@if exist "$(CLI_BIN)" ( "$(CLI_BIN)" doctor ) \
	else ( echo bokken-cli not built yet - run "make build" first. )

else

# Build, then launch — delegates to the deployed bokken-cli so `make run`
# and `bokken-cli run` behave identically. Falls back to launching the
# binary directly if the CLI somehow isn't present.
run: build
	@CLI="$(BUILD_TEMP)/bin/bokken-cli$(EXE_SUFFIX)"; \
	if [ -x "$$CLI" ]; then \
	    "$$CLI" run --no-build; \
	else \
	    .$(P_SEP)$(BIN); \
	fi

# Incremental rebuild + live reload, delegated to bokken-cli (built as
# part of the engine during the first `make build` and deployed next to
# the game). --bin tells the watcher exactly which executable to relaunch
# so it never picks up a stray binary sharing the bin directory. Falls
# back to a bokken-cli on PATH when the engine resolved the CLI that way.
watch: build
	@CLI="$(BUILD_TEMP)/bin/bokken-cli$(EXE_SUFFIX)"; \
	if [ ! -x "$$CLI" ]; then CLI="bokken-cli"; fi; \
	"$$CLI" watch --run --bin "$(APP_NAME)"

# Verify the toolchain (node/npx, cmake, git) the build depends on.
# Falls back to a plain message if the CLI hasn't been built yet.
doctor:
	@CLI="$(BUILD_TEMP)/bin/bokken-cli$(EXE_SUFFIX)"; \
	if [ ! -x "$$CLI" ]; then CLI="$$(command -v bokken-cli || true)"; fi; \
	if [ -n "$$CLI" ]; then \
	    "$$CLI" doctor; \
	else \
	    echo "bokken-cli not built yet — run 'make build' first."; \
	fi

endif

# tsc only — no cmake.
typescript: $(TS_STAMP)

# Install bokken-cli onto your PATH so you can drive everything with a bare
# `bokken-cli run` / `bokken-cli watch` from any project directory. Builds
# first if the CLI hasn't been produced yet. bokken-cli is a self-contained
# binary (it statically links its qjs/miniz deps), so a plain copy is enough.
ifeq ($(OS),Windows_NT)

install: build
	@if not exist "$(INSTALL_DIR)" mkdir "$(INSTALL_DIR)"
	@copy /Y "$(CLI_BIN)" "$(INSTALL_DIR)\bokken-cli$(EXE_SUFFIX)" >nul || (echo Error: failed to copy bokken-cli to "$(INSTALL_DIR)". & exit /b 1)
	@echo Installed bokken-cli to "$(INSTALL_DIR)\bokken-cli$(EXE_SUFFIX)"
	@echo %PATH% | findstr /I /C:"$(INSTALL_DIR)" >nul && (echo You can now run: bokken-cli run) || (echo. & echo NOTE: "$(INSTALL_DIR)" is not on your PATH yet. Add it once with: & echo     setx PATH "%PATH%;$(INSTALL_DIR)" & echo then open a NEW terminal.)

uninstall:
	@if exist "$(INSTALL_DIR)\bokken-cli$(EXE_SUFFIX)" (del /Q "$(INSTALL_DIR)\bokken-cli$(EXE_SUFFIX)" & echo Removed "$(INSTALL_DIR)\bokken-cli$(EXE_SUFFIX)") else (echo Nothing to remove at "$(INSTALL_DIR)\bokken-cli$(EXE_SUFFIX)")

else

install: build
	@set -e; \
	DEST="$(INSTALL_DIR)"; \
	BINPATH="$$DEST/bokken-cli$(EXE_SUFFIX)"; \
	if ! mkdir -p "$$DEST" 2>/dev/null || ! cp "$(CLI_BIN)" "$$BINPATH" 2>/dev/null; then \
	    echo ""; \
	    echo "Error: cannot write to $$DEST (permission denied)."; \
	    echo "The default prefix is your home directory and needs no sudo,"; \
	    echo "so this usually means you overrode PREFIX to a system path."; \
	    echo "For a system-wide install, build first, then install with sudo:"; \
	    echo "    make build && sudo make install PREFIX=$(PREFIX)"; \
	    exit 1; \
	fi; \
	chmod +x "$$BINPATH"; \
	echo "Installed bokken-cli -> $$BINPATH"; \
	case ":$$PATH:" in \
	    *":$$DEST:"*) echo "You can now run: bokken-cli run" ;; \
	    *) echo ""; \
	       echo "NOTE: $$DEST is not on your PATH yet. Add this to your shell"; \
	       echo "profile (~/.bashrc or ~/.zshrc), then restart your shell:"; \
	       echo "    export PATH=\"$$DEST:\$$PATH\"" ;; \
	esac

uninstall:
	@DEST="$(INSTALL_DIR)"; \
	rm -f "$$DEST/bokken-cli$(EXE_SUFFIX)" && \
	echo "Removed $$DEST/bokken-cli$(EXE_SUFFIX)" || \
	echo "Nothing to remove at $$DEST/bokken-cli$(EXE_SUFFIX)"

endif

# Wipe everything, including the FetchContent cache. Forces a fresh
# engine clone on the next build.
clean:
	$(CLEAN_CMD)

.PHONY: all build setup run watch doctor install uninstall typescript clean