"""
updates a single led grid according to the input specifications
uses a python wrapper (rpi_ws281x) for the neopixel library
"""

import sys
from neopixel import *

# LED strip configuration:
LED_PIN     = 18      # GPIO pin connected to the pixels (must support PWM!).
LED_FREQ_HZ = 800000  # LED signal frequency in hertz (usually 800khz)
LED_DMA     = 5       # DMA channel to use for generating signal (try 5)
LED_INVERT  = False   # True to invert the signal (when using NPN transistor level shift)

# Parse the input
SYS_INPUT = str(sys.argv[1]).split('\n') # each piece of data is newline separated

try:
  LED_COUNT = int(SYS_INPUT[0]) # Number of LED pixels.
  LED_ID = int(SYS_INPUT[1]) # ID of the LED
  LED_RED = int(SYS_INPUT[2]) # Red value
  LED_GREEN = int(SYS_INPUT[3]) # Blue value
  LED_BLUE = int(SYS_INPUT[4]) # Green value
except ValueError:
  LED_COUNT = 0
  LED_ID = 0
  LED_RED = 0
  LED_GREEN = 0
  LED_BLUE = 0

# Create NeoPixel object with appropriate configuration.
strip = Adafruit_NeoPixel(LED_COUNT, LED_PIN, LED_FREQ_HZ, LED_DMA, LED_INVERT)

# Intialize the library (must be called once before other functions).
strip.begin()

# Set the LED
strip.setPixelColor(LED_ID, Color(
  LED_RED, LED_GREEN, LED_BLUE)
)

# Show the results
strip.show()
