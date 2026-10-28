# Given litres of grain, compute makopokopo (20L) and remainder
.data
prompt: .asciz "Enter grains in litres: "
makos:  .asciz "Makopokopo (20L) = "
remain: .asciz ", Remainder = "

.text
.globl main
main:
  # Prompt
  la a0, prompt
  li a7, 4
  ecall

  # Read integer (litres)
  li a7, 5
  ecall
  mv t0, a0          # total litres

  # Divide by 20
  li t1, 20
  div t2, t0, t1     # t2 = makopokopo
  rem t3, t0, t1     # t3 = remainder

  # Print makopokopo
  la a0, makos
  li a7, 4
  ecall
  mv a0, t2
  li a7, 1
  ecall

  # Print remainder
  la a0, remain
  li a7, 4
  ecall
  mv a0, t3
  li a7, 1
  ecall

  # Exit
  li a7, 10
  ecall
