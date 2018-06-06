
"""
clears the led grid
uses a python wrapper (rpi_ws281x) for the neopixel library
"""

import sys
from neopixel import *

# LED strip configuration:
LED_COUNT   = 36      # Number of LED pixels.
LED_PIN     = 18      # GPIO pin connected to the pixels (must support PWM!).
LED_FREQ_HZ = 800000  # LED signal frequency in hertz (usually 800khz)
LED_DMA     = 5       # DMA channel to use for generating signal (try 5)
LED_INVERT  = False   # True to invert the signal (when using NPN transistor level shift)


# Define functions which animate LEDs in various ways.
def clearGrid(strip):
  # Change strip to varying colours
  for i in range(strip.numPixels()):
    strip.setPixelColor(i, Color(0, 0, 0))
  
  strip.show()


# Create NeoPixel object with appropriate configuration.
strip = Adafruit_NeoPixel(LED_COUNT, LED_PIN, LED_FREQ_HZ, LED_DMA, LED_INVERT)

# Intialize the library (must be called once before other functions).
strip.begin()

clearGrid(strip)
