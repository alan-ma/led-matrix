import sys

try:
  while True:
    new_input = sys.stdin.readline()
    print(new_input)
except KeyboardInterrupt:
  print('stopped')
