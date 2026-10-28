# Input number 1–7 and print Sesotho day name
.data
prompt: .asciz "Enter day number (1-7): "
error:  .asciz "Invalid day number\n"
day1:   .asciz "Mantaha\n"
day2:   .asciz "Labobeli\n"
day3:   .asciz "Laboraro\n"
day4:   .asciz "Labone\n"
day5:   .asciz "Labohlano\n"
day6:   .asciz "Moqebelo\n"
day7:   .asciz "Sontaha\n"

.text
.globl main
main:
  # Prompt
  la a0, prompt
  li a7, 4
  ecall

  # Read number
  li a7, 5
  ecall
  mv t0, a0

  # Branch on value
  li t1, 1
  beq t0, t1, case1
  li t1, 2
  beq t0, t1, case2
  li t1, 3
  beq t0, t1, case3
  li t1, 4
  beq t0, t1, case4
  li t1, 5
  beq t0, t1, case5
  li t1, 6
  beq t0, t1, case6
  li t1, 7
  beq t0, t1, case7

  # Invalid
  la a0, error
  li a7, 4
  ecall
  j exit

case1:
  la a0, day1
  li a7, 4
  ecall
  j exit

case2:
  la a0, day2
  li a7, 4
  ecall
  j exit

case3:
  la a0, day3
  li a7, 4
  ecall
  j exit

case4:
  la a0, day4
  li a7, 4
  ecall
  j exit

case5:
  la a0, day5
  li a7, 4
  ecall
  j exit

case6:
  la a0, day6
  li a7, 4
  ecall
  j exit

case7:
  la a0, day7
  li a7, 4
  ecall

exit:
  li a7, 10
  ecall
