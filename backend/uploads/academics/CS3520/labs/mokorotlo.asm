# Print triangle pattern of '*'
.data
prompt: .asciz "Enter height n: "
star:   .asciz "*"
newline:.asciz "\n"

.text
.globl main
main:
  # Prompt
  la a0, prompt
  li a7, 4
  ecall

  # Read n
  li a7, 5
  ecall
  mv t0, a0     # n
  li t1, 1      # row = 1

outer_loop:
  bgt t1, t0, done   # if row > n, exit

  li t2, 0           # col counter

inner_loop:
  bge t2, t1, print_newline
  la a0, star
  li a7, 4
  ecall
  addi t2, t2, 1
  j inner_loop

print_newline:
  la a0, newline
  li a7, 4
  ecall

  addi t1, t1, 1
  j outer_loop

done:
  li a7, 10
  ecall
