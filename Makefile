PROJECT:=$(notdir $(CURDIR)).sb3
leveldata.txt: $(wildcard levels/*.png)
	python pre_build.py
$(PROJECT): leveldata.txt goboscript.toml $(wildcard *.gs lib/*.gs backpack/**/*.gs assets/**/*.png assets/**/*.svg)
	goboscript b
all: $(PROJECT)
clean:
	rm -rf "$(PROJECT)" leveldata.txt
.PHONY: all clean
