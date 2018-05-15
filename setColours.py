"""
updates the led grid according to the input matrix
uses a python wrapper (rpi_ws281x) for the neopixel library
"""

import sys
from neopixel import *

# LED strip configuration:
LED_COUNT   = 10      # Number of LED pixels.
LED_PIN     = 18      # GPIO pin connected to the pixels (must support PWM!).
LED_FREQ_HZ = 800000  # LED signal frequency in hertz (usually 800khz)
LED_DMA     = 5       # DMA channel to use for generating signal (try 5)
LED_INVERT  = False   # True to invert the signal (when using NPN transistor level shift)

# Parse the input
SYS_INPUT = str(sys.argv[1]).split('\n') # each LED is newline separated
SET_LED_COLOURS = [] # initialize the list

for i in range(len(SYS_INPUT)):
  new_item = SYS_INPUT.split(',') # each LED specification is comma separated
  SET_LED_COLOURS.append([]) # add an empty list
  for j in range(len(new_item)):
    try:
      SET_LED_COLOURS[i].append(int(new_item[j])) # try adding the number
    except ValueError:
      SET_LED_COLOURS[i].append(0) # add 0 if NaN


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

setColours(strip, SET_LED_COLOURS)
