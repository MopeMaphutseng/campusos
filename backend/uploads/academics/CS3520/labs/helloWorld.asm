.data 
msg:
.asciz "Hello World\n" # Null-terminated string
.text
.globl main
main:
   la a0, msg # Load address of string into a0
   LI a7, 4 # system call: print string ecall # Make the system call
   li a7, 10 # system call: exit
   ecall