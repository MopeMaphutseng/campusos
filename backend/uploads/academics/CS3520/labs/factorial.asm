.data
   prompt: .asciz "Enter  positive integer:"
   error: .asciz  "Error: Please enter a non-negative.\n"
   result: .asciz "The factorial is: "
.text
.global main
main:
  # Print prompt
  la a0, prompt
  li a7, 4
  ecall
  #Read integer input
  li a7, 5
  ecall
  mv t0, a0 # store input n in t0
  # If n < 0, print error and exit
  blt t0, x0, print_error
  #Initialize factorial = 1
  li t1, 1 # factorial result
  li t2, 1 # counter i = 1
  loop:
    bgt t2, t0, done # if i > n, exit loopgfv
    mul t1, t1, t2 #factorial *= i
    addi t2, t2, 1 #i++ j loop
done:
  #Print result label
  la a0, result
  li a7, 4
  ecall
#Print factorial result
  mv a0, t1
  li a7, 1
  ecall
  j exit
print_error:
  la a0, error
  li a7, 4
  ecall
exit:
  li a7, 10
  ecall