# Classify owner based on cattle number
.data
prompt: .asciz "Enter number of cattle: "
notEnough: .asciz "Not enough for bohali\n"
small:     .asciz "Small herd\n"
wealthy:   .asciz "Wealthy cattle owner\n"

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

  # Classification
  li t1, 8
  blt t0, t1, case_notEnough

  li t1, 30
  blt t0, t1, case_small

  j case_wealthy

case_notEnough:
  la a0, notEnough
  li a7, 4
  ecall
  j exit

case_small:
  la a0, small
  li a7, 4
  ecall
  j exit

case_wealthy:
  la a0, wealthy
  li a7, 4
  ecall

exit:
  li a7, 10
  ecall
