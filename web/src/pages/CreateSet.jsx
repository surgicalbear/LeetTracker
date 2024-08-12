import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Stepper, Button, Group, TextInput, Select, Textarea, Code, Title, Space } from '@mantine/core';
import { useForm } from '@mantine/form';
import { withAuth0 } from "@auth0/auth0-react";
import classes from './styles/NotFoundTitle.module.css'

const CreateSet = ({ auth0 }) => {
  const [active, setActive] = useState(0);
  const navigate = useNavigate();
  const { getAccessTokenSilently, isLoading, user, isAuthenticated } = auth0;

  const form = useForm({
    initialValues: {
      name: '',
      description: '',
      tags: '',
      difficulty: '',
      estimatedTime: '',
      notes: '',
    },
    validate: (values, step) => {
    const errors = {};
    if (step === 0) {
      if (values.name.trim().length < 2) {
        errors.name = 'Name must include at least 2 characters';
      }
      if (values.description.trim().length < 10) {
        errors.description = 'Description must include at least 10 characters';
      }
    } else if (step === 1) {
      if (!values.difficulty) {
        errors.difficulty = 'Please select a difficulty';
      }
    }
    return errors;
  },
  });

  const nextStep = () =>
    setActive((current) => {
      if (form.validate(current).hasErrors) {
        return current;
      }
      return current < 3 ? current + 1 : current;
    });

  const prevStep = () => setActive((current) => (current > 0 ? current - 1 : current));

  const handleSubmit = async () => {
    if (form.validate().hasErrors) {
      return;
    }
    try {
      const token = await getAccessTokenSilently();
      const response = await fetch('http://localhost:8080/lists', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(form.values),
      });
      if (!response.ok) {
        throw new Error('Failed to create list');
      }
      const data = await response.json();
      navigate('/sets');
    } catch (error) {
      console.error('Error creating list:', error);
    }
  };

  if (isLoading || !user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container">
      <div className="jumbotron text-center mt-5">
        <Title order={1} className={classes.title}>Create New Set</Title>
        <Space h="xl" />
        <Stepper active={active}>
          <Stepper.Step label="Basic Info" description="Set name and description">
            <TextInput
              label="Set Name"
              placeholder="Enter set name"
              required
              {...form.getInputProps('name')}
            />
            <Textarea
              mt="md"
              label="Description"
              placeholder="Enter set description"
              required
              {...form.getInputProps('description')}
            />
          </Stepper.Step>
          <Stepper.Step label="Details" description="Difficulty and tags">
            <Select
              label="Difficulty"
              placeholder="Select difficulty"
              required
              data={[
                { value: 'easy', label: 'Easy'},
                { value: 'medium', label: 'Medium'},
                { value: 'hard', label: 'Hard'},
              ]}
              {...form.getInputProps('difficulty')}
            />
            <TextInput
              mt="md"
              label="Tags (Optional)"
              placeholder="Enter tags (comma-separated)"
              {...form.getInputProps('tags')}
            />
          </Stepper.Step>
          <Stepper.Step label="Additional Info" description="Time and notes">
            <TextInput
              label="Estimated Time (Optional)"
              placeholder="Enter estimated completion time"
              {...form.getInputProps('estimatedTime')}
            />
            <Textarea
              mt="md"
              label="Notes (Optional)"
              placeholder="Enter any additional notes"
              {...form.getInputProps('notes')}
            />
          </Stepper.Step>
          <Stepper.Completed>
            Completed! Form values:
            <Code block mt="xl">
              {JSON.stringify(form.values, null, 2)}
            </Code>
          </Stepper.Completed>
        </Stepper>
        <Group justify="flex-end" mt="xl">
          {active !== 0 && (
            <Button variant="subtle" onClick={prevStep}>
              Back
            </Button>
          )}
          {active !== 3 && <Button variant="subtle" onClick={nextStep}>Next step</Button>}
          {active === 3 && <Button variantr="subtle" onClick={handleSubmit}>Create Set</Button>}
        </Group>
      </div>
    </div>
  );
};

export default withAuth0(CreateSet);