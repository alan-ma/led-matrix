
"""
clears the led grid
uses a python wrapper (rpi_ws281x) for the neopixel library
"""

import sys
from neopixel import *

print("STARTED")

# LED strip configuration:
LED_COUNT   = 10      # Number of LED pixels.
LED_PIN     = 18      # GPIO pin connected to the pixels (must support PWM!).
LED_FREQ_HZ = 800000  # LED signal frequency in hertz (usually 800khz)
LED_DMA     = 5       # DMA channel to use for generating signal (try 5)
LED_INVERT  = False   # True to invert the signal (when using NPN transistor level shift)

# LED Grid initialization
LEDGrid = []
for i in range(LED_COUNT):
  LEDGrid.append([0, 0, 0]);


# Define functions which animate LEDs in various ways.
def setColours(strip, set_colours):
  """Change strip to varying colours"""
  for i in range(strip.numPixels()):
    strip.setPixelColor(i, Color(
      set_colours[i][0], set_colours[i][1], set_colours[i][2])
    )

  strip.show()


# Create NeoPixel object with appropriate configuration.
strip = Adafruit_NeoPixel(LED_COUNT, LED_PIN, LED_FREQ_HZ, LED_DMA, LED_INVERT)

# Intialize the library (must be called once before other functions).
strip.begin()

setColours(strip, LEDGrid)

print("FINISHED")
sys.stdout.flush()