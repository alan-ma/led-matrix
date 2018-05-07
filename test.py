import sys

first_message = str(sys.argv[1])
second_message = str(sys.argv[2])

results = {
  'returnMessage': 'Hello World! Your message is: {} {}'.format(first_message, second_message),
  'first_message': first_message,
  'second_message': second_message
}

print(str(results))
sys.stdout.flush()

